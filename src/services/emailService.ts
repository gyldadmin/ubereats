import Constants from 'expo-constants';
import { 
    DynamicContentData,
    EmailAddressLookup,
  EmailServiceInputs, 
  EmailServiceResponse, 
  EmailTemplateLookup, 
    GatheringDynamicData,
    NotificationSentRecord,
  NotificationTypeLookup, 
  SendGridPayload,
  SendGridPersonalization,
    StatusOptionLookup
} from '../types/email';
import { getProcessedContentTemplate } from './contentTemplateService';
import { supabase } from './supabase';

export class EmailService {
  private sendGridApiKey: string;

  constructor() {
    // Load SendGrid API key from hidden file
    this.sendGridApiKey = this.loadSendGridApiKey();
  }

  private get isE2E(): boolean {
    try {
      const extra: any = Constants?.expoConfig?.extra ?? {};
      return (
        process.env.E2E === 'true' ||
        process.env.EXPO_PUBLIC_E2E === 'true' ||
        extra.EXPO_PUBLIC_E2E === 'true'
      );
    } catch {
      return process.env.E2E === 'true' || process.env.EXPO_PUBLIC_E2E === 'true';
    }
  }

  /**
   * Main entry point for sending emails immediately
   * All scheduling should now be handled by the central scheduler
   */
  async send(inputs: EmailServiceInputs): Promise<EmailServiceResponse> {
    try {
      console.log('EmailService: Processing immediate email request', {
        template: inputs.template_name,
        email_type: inputs.email_type,
        recipients: inputs.to_address?.length || 'dynamic',
        has_recipient_source: !!inputs.recipient_source,
        has_content_source: !!inputs.content_source
      });

      // Validate inputs
      this.validateInputs(inputs);

      // Resolve dynamic inputs and send immediately
        const resolvedInputs = await this.resolveDynamicInputs(inputs);
        const emailId = await this.sendImmediately(resolvedInputs);
      
        return {
          success: true,
          message: 'Email sent successfully',
          emailId
        };

    } catch (error) {
      console.error('EmailService: Error processing email request', error);
      return {
        success: false,
        message: 'Failed to process email request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send email immediately via SendGrid
   */
  private async sendImmediately(inputs: EmailServiceInputs): Promise<string> {
    try {
      console.log('EmailService: Sending email immediately');

      // Perform database lookups
      const [templateData, senderAddress, notificationTypeId] = await Promise.all([
        this.lookupTemplate(inputs.template_name),
        this.lookupSenderAddress(inputs.email_type),
        this.lookupWorkflowType('email')
      ]);

      // Build SendGrid payload
      const sendGridPayload = this.buildSendGridPayload(inputs, templateData, senderAddress);

      // Send via SendGrid API (skip in E2E mode)
      const emailId = this.isE2E
        ? 'e2e-message-id'
        : await this.callSendGridApi(sendGridPayload);

      // Record the sent notification
      await this.recordNotificationSent({
        workflow_type: notificationTypeId.id,
        to_address: inputs.to_address,
        body1: inputs.body1,
        subject: inputs.subject,
        send_date: new Date(),
        status: 'sent'
      });

      console.log('EmailService: Email sent successfully', { emailId });
      return emailId;
    } catch (error) {
      console.error('EmailService: Error sending immediate email', error);
      
      // Record failed notification
      await this.recordFailedNotification(inputs, error);

      throw error;
    }
  }







  /**
   * Database lookup methods
   */
  private async lookupTemplate(templateName: string): Promise<EmailTemplateLookup> {
    console.log('EmailService: Looking up email template', { templateName });
    
    const { data, error } = await supabase
      .from('email_template_ids')
      .select('id, label, template_id, template_variables, json_template')
      .eq('label', templateName)
      .single();

    if (error || !data) {
      console.warn(`EmailService: Template '${templateName}' not found, using fallback: ${error?.message}`);
      
      // Return fallback template data
      return {
        id: 'fallback',
        label: templateName,
        template_id: '', // Empty template_id will trigger content-based email
        template_variables: ['body1', 'subject', 'buttontext', 'buttonurl', 'unsubscribeurl'],
        json_template: {}
      };
    }

    return data as EmailTemplateLookup;
  }

  private async lookupSenderAddress(emailType: string): Promise<EmailAddressLookup> {
    console.log('EmailService: Looking up sender address', { emailType });
    
    const { data, error } = await supabase
      .from('email')
      .select('id, label, address')
      .eq('label', emailType)
      .single();

    if (error || !data) {
      console.warn(`EmailService: Email type '${emailType}' not found, using fallback: ${error?.message}`);
      
      // Return fallback sender address
      return {
        id: 'fallback',
        label: emailType,
        address: 'noreply@gyld.org' // Default fallback email
      };
    }

    return data as EmailAddressLookup;
  }

  private async lookupWorkflowType(typeLabel: string): Promise<NotificationTypeLookup> {
    console.log('EmailService: Looking up workflow type', { typeLabel });
    
    const { data, error } = await supabase
      .from('workflow_type')
      .select('id, label')
      .eq('label', typeLabel)
      .single();

    if (error || !data) {
      console.warn(`EmailService: Workflow type '${typeLabel}' not found, using fallback: ${error?.message}`);
      
      // Return fallback workflow type
      return {
        id: 'fallback',
        label: typeLabel
      };
    }

    return data as NotificationTypeLookup;
  }

  private async lookupStatusOption(statusLabel: string): Promise<StatusOptionLookup> {
    console.log('EmailService: Looking up status option', { statusLabel });
    
    const { data, error } = await supabase
      .from('status_options')
      .select('id, label')
      .eq('label', statusLabel)
      .single();

    if (error || !data) {
      throw new Error(`Status option '${statusLabel}' not found: ${error?.message}`);
    }

    return data as StatusOptionLookup;
  }

  /**
   * Build SendGrid API payload using template mapping
   */
  private buildSendGridPayload(
    inputs: EmailServiceInputs, 
    templateData: EmailTemplateLookup, 
    senderAddress: EmailAddressLookup
  ): SendGridPayload {
    console.log('EmailService: Building SendGrid payload');

    // Transform recipient arrays to SendGrid format
    const toAddresses = inputs.to_address.map(email => ({ email }));
    const ccAddresses = inputs.cc_address?.map(email => ({ email }));
    const bccAddresses = inputs.bcc_address?.map(email => ({ email }));

    // Check if we have a valid template_id
    const hasValidTemplateId = templateData.template_id && 
                              templateData.template_id !== '' && 
                              templateData.template_id !== 'd-placeholder123';

    let payload: SendGridPayload;

    if (hasValidTemplateId) {
      // Use dynamic template (preferred method)
      const dynamicTemplateData: Record<string, any> = {
        body1: inputs.body1,
        subject: inputs.subject,
        buttonurl: inputs.buttonurl || '',
        buttontext: inputs.buttontext || '',
        unsubscribeurl: inputs.unsubscribeurl || ''
      };

      // Add optional fields if provided
      if (inputs.body2) {
        dynamicTemplateData.body2 = inputs.body2; // For basic_with_button template
        dynamicTemplateData.sub = inputs.body2; // For invite_with_envelope template
      }
      if (inputs.header_image) dynamicTemplateData.header_image = inputs.header_image;
      if (inputs.body_image) dynamicTemplateData.body_image = inputs.body_image;
      
      // Add personalization fields for invite_with_envelope template
      if (inputs.first) dynamicTemplateData.first = inputs.first;
      if (inputs.gath_date) dynamicTemplateData.date = inputs.gath_date; // Maps to "date" in template
      if (inputs.gath_title) dynamicTemplateData.title = inputs.gath_title; // Maps to "title" in template
      
      // Map body1 to subtitle for invite_with_envelope template (maintaining backward compatibility)
      dynamicTemplateData.subtitle = inputs.body1;

      // Build personalization
      const personalization: SendGridPersonalization = {
        to: toAddresses,
        dynamic_template_data: dynamicTemplateData
      };

      if (ccAddresses && ccAddresses.length > 0) {
        personalization.cc = ccAddresses;
      }

      if (bccAddresses && bccAddresses.length > 0) {
        personalization.bcc = bccAddresses;
      }

      payload = {
        personalizations: [personalization],
        from: {
          email: senderAddress.address,
          name: inputs.sender_fullname
        },
        template_id: templateData.template_id
      };
    } else {
      // Fallback to content-based email (no template)
      console.warn('EmailService: No valid template_id found, using content-based email');
      
      // Build basic HTML content
      const htmlContent = this.buildFallbackHtmlContent(inputs);
      const textContent = inputs.body1;

      const personalization: SendGridPersonalization = {
        to: toAddresses,
        subject: inputs.subject
      };

      if (ccAddresses && ccAddresses.length > 0) {
        personalization.cc = ccAddresses;
      }

      if (bccAddresses && bccAddresses.length > 0) {
        personalization.bcc = bccAddresses;
      }

      payload = {
        personalizations: [personalization],
        from: {
          email: senderAddress.address,
          name: inputs.sender_fullname
        },
        subject: inputs.subject,
        content: [
          {
            type: 'text/plain',
            value: textContent
          },
          {
            type: 'text/html', 
            value: htmlContent
          }
        ]
      };
    }

    // Add reply-to if provided
    if (inputs.reply_to_address) {
      payload.reply_to = {
        email: inputs.reply_to_address,
        name: inputs.reply_to_name
      };
    }

    return payload;
  }

  /**
   * Build fallback HTML content when no template is available
   */
  private buildFallbackHtmlContent(inputs: EmailServiceInputs): string {
    let html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #13BEC7;">${inputs.subject}</h2>
            <p>${inputs.body1}</p>
    `;

    // Add second body if provided
    if (inputs.body2) {
      html += `<p>${inputs.body2}</p>`;
    }

    // Add button if provided
    if (inputs.buttontext && inputs.buttonurl) {
      html += `
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inputs.buttonurl}" 
             style="background-color: #13BEC7; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            ${inputs.buttontext}
          </a>
        </div>
      `;
    }

    // Add unsubscribe link if provided
    if (inputs.unsubscribeurl) {
      html += `
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          <a href="${inputs.unsubscribeurl}" style="color: #666;">Unsubscribe</a>
        </p>
      `;
    }

    html += `
          </div>
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Call SendGrid API to send email
   */
  private async callSendGridApi(payload: SendGridPayload): Promise<string> {
    console.log('EmailService: Calling SendGrid API');

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // SendGrid returns message ID in X-Message-Id header
      const messageId = response.headers.get('X-Message-Id') || 'unknown';
      
      console.log('EmailService: SendGrid API call successful', { messageId });
      return messageId;

    } catch (error) {
      console.error('EmailService: SendGrid API call failed', error);
      throw new Error(`Failed to send email via SendGrid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Record notification in notifications_sent table
   */
  private async recordNotificationSent(record: NotificationSentRecord): Promise<void> {
    console.log('EmailService: Recording notification sent', { status: record.status || 'sent' });

    const { error } = await supabase
      .from('notifications_sent')
      .insert({
        workflow_type: record.workflow_type,
        to_address: record.to_address,
        body1: record.body1,
        subject: record.subject,
        send_date: record.send_date.toISOString(),
        status: record.status || 'sent'
      });

    if (error) {
      console.error('EmailService: Failed to record notification sent', error);
      // Don't throw here - we don't want to fail the email send because of logging issues
    } else {
      console.log('EmailService: Successfully recorded notification sent');
    }
  }

  /**
   * Record failed notification when entire email operation fails
   */
  private async recordFailedNotification(inputs: EmailServiceInputs, error: any): Promise<void> {
    try {
      const emailWorkflowType = await this.lookupWorkflowType('email');

      await supabase
        .from('notifications_sent')
        .insert({
          workflow_type: emailWorkflowType.id,
          to_address: inputs.to_address,
          body1: inputs.body1,
          subject: inputs.subject,
          send_date: new Date(),
          status: 'failed'
        });

      console.log('EmailService: Recorded failed email notification for all recipients');
    } catch (recordError) {
      console.error('EmailService: Failed to record failed notification', recordError);
    }
  }

  /**
   * Utility methods
   */
  private loadSendGridApiKey(): string {
    if (this.isE2E) {
      console.log('EmailService: E2E mode – skipping SendGrid key requirement');
      return 'e2e-dummy';
    }
    // Try multiple sources for the API key
    let apiKey: string | undefined;

    // 1. Try Expo Constants (works with .env files)
    try {
      apiKey = Constants.expoConfig?.extra?.SENDGRID_API_KEY || 
               Constants.manifest?.extra?.SENDGRID_API_KEY ||
               Constants.manifest2?.extra?.expoClient?.extra?.SENDGRID_API_KEY;
    } catch (error) {
      console.warn('EmailService: Could not access Expo Constants');
    }

    // 2. Fallback to public environment variables (not recommended for API keys)
    if (!apiKey) {
      apiKey = process.env.EXPO_PUBLIC_SENDGRID_API_KEY;
    }

    // 3. Last resort: try direct process.env (may work in some environments)
    if (!apiKey) {
      apiKey = process.env.SENDGRID_API_KEY;
    }

    if (apiKey && apiKey !== 'SG.EXAMPLE_KEY_REPLACE_WITH_ACTUAL_SENDGRID_API_KEY') {
      console.log('EmailService: SendGrid API key loaded successfully');
      return apiKey;
    }

    throw new Error(
      'SendGrid API key not found. In React Native/Expo, you need to:\n' +
      '1. Add SENDGRID_API_KEY to your app.json extra config, or\n' +
      '2. Set EXPO_PUBLIC_SENDGRID_API_KEY in your .env file (public - not recommended), or\n' +
      '3. Configure the key in your app configuration.\n' +
      'Current environment: ' + JSON.stringify({ 
        hasConstants: !!Constants.expoConfig,
        hasManifest: !!Constants.manifest,
        publicKey: !!process.env.EXPO_PUBLIC_SENDGRID_API_KEY,
        processKey: !!process.env.SENDGRID_API_KEY
      })
    );
  }





  /**
   * Dynamic input resolution
   */
  
  // Resolve dynamic inputs to static inputs compatible with existing code
  private async resolveDynamicInputs(inputs: EmailServiceInputs): Promise<EmailServiceInputs> {
    console.log('EmailService: Resolving dynamic inputs');
    
    const resolvedInputs = { ...inputs };
    
    // Resolve recipients if using dynamic source
    if (inputs.recipient_source) {
      console.log('EmailService: Resolving dynamic recipients');
      resolvedInputs.to_address = await this.fetchRecipients(inputs.recipient_source);
      
      // Clear the recipient_source since we now have resolved emails
      delete resolvedInputs.recipient_source;
    }
    
    // Resolve content if using dynamic source
    if (inputs.content_source) {
      console.log('EmailService: Resolving dynamic content');
      const contentData = await this.fetchContentData(inputs.content_source);
      const processedContent = await this.renderDynamicContent(inputs.content_source, contentData);
      
      // Update resolved inputs with rendered content
      resolvedInputs.subject = processedContent.subject;
      resolvedInputs.body1 = processedContent.body1;
      resolvedInputs.body2 = processedContent.body2;
      
      // Add personalization if available
      if (contentData.user?.first_name) {
        resolvedInputs.first = contentData.user.first_name;
      }
      
      if (contentData.gathering) {
        resolvedInputs.gath_title = contentData.gathering.title;
        resolvedInputs.gath_date = contentData.gathering.date_time;
      }
      
      // Clear the content_source since we now have resolved content
      delete resolvedInputs.content_source;
    }
    
    console.log('EmailService: Dynamic inputs resolved', {
      recipients: resolvedInputs.to_address?.length,
      subject: resolvedInputs.subject?.substring(0, 50) + '...'
    });
    
    return resolvedInputs;
  }
  
  // Render dynamic content using content templates
  private async renderDynamicContent(
    contentSource: NonNullable<EmailServiceInputs['content_source']>, 
    contentData: DynamicContentData
  ): Promise<{ subject: string; body1: string; body2?: string }> {
    try {
      // Build template variables from dynamic data
      const templateVariables: Record<string, string | number | null> = {};
      
      if (contentData.gathering) {
        templateVariables.gathering_title = contentData.gathering.title;
        templateVariables.gathering_date = contentData.gathering.date_time || '';
        templateVariables.gathering_location = contentData.gathering.location || '';
        templateVariables.attendee_count = contentData.gathering.attendee_count || 0;
      }
      
      if (contentData.user) {
        templateVariables.first_name = contentData.user.first_name || '';
        templateVariables.user_email = contentData.user.email;
      }
      
      if (contentData.candidate) {
        templateVariables.candidate_name = contentData.candidate.first_name || '';
        templateVariables.candidate_status = contentData.candidate.status || '';
      }
      
      // Fetch and process the content template
      const processedTemplate = await getProcessedContentTemplate(
        contentSource.template_key,
        'email',
        templateVariables
      );
      
      if (!processedTemplate) {
        throw new Error(`Content template '${contentSource.template_key}' not found or failed to process`);
      }
      
      return {
        subject: processedTemplate.processed_primary_text || 'Email Subject',
        body1: processedTemplate.processed_secondary_text || 'Email Body',
        body2: processedTemplate.processed_tertiary_text
      };
      
    } catch (error) {
      console.error('EmailService: Error rendering dynamic content', error);
      throw new Error(`Failed to render dynamic content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Dynamic data fetching methods
   */
  
  // Fetch recipients based on dynamic source
  private async fetchRecipients(recipientSource: NonNullable<EmailServiceInputs['recipient_source']>): Promise<string[]> {
    console.log('EmailService: Fetching dynamic recipients', { type: recipientSource.type });
    
    try {
      switch (recipientSource.type) {
        case 'rsvp_list':
          return await this.fetchRSVPRecipients(recipientSource.gathering_id!, recipientSource.rsvp_status || 'yes');
          
        case 'user_ids':
          return await this.fetchUserEmailsByIds(recipientSource.user_ids!);
          
        case 'gyld_members':
          return await this.fetchGyldMemberEmails(recipientSource.gyld_id!);
          
        case 'static_emails':
          return recipientSource.static_emails!;
          
        default:
          throw new Error(`Unknown recipient source type: ${(recipientSource as any).type}`);
      }
    } catch (error) {
      console.error('EmailService: Error fetching dynamic recipients', error);
      throw new Error(`Failed to fetch recipients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fetch RSVP list for gathering
  private async fetchRSVPRecipients(gatheringId: string, rsvpStatus: string): Promise<string[]> {
    console.log('EmailService: Fetching RSVP recipients', { gatheringId, rsvpStatus });
    
    const { data, error } = await supabase
      .from('participation_gatherings')
      .select(`
        users_private!inner(email)
      `)
      .eq('gathering_id', gatheringId)
      .eq('part_gath_status.label', rsvpStatus);
    
    if (error) {
      throw new Error(`Failed to fetch RSVP recipients: ${error.message}`);
    }
    
    return (data || []).map((item: any) => item.users_private.email).filter(Boolean);
  }
  
  // Fetch user emails by user IDs
  private async fetchUserEmailsByIds(userIds: string[]): Promise<string[]> {
    console.log('EmailService: Fetching user emails by IDs', { count: userIds.length });
    
    const { data, error } = await supabase
      .from('users_private')
      .select('email')
      .in('user_id', userIds);
    
    if (error) {
      throw new Error(`Failed to fetch user emails: ${error.message}`);
    }
    
    return (data || []).map(item => item.email).filter(Boolean);
  }
  
  // Fetch gyld member emails
  private async fetchGyldMemberEmails(gyldId: string): Promise<string[]> {
    console.log('EmailService: Fetching gyld member emails', { gyldId });
    
    const { data, error } = await supabase
      .from('gyld')
      .select(`
        users_private!inner(email)
      `)
      .eq('id', gyldId);
    
    if (error) {
      throw new Error(`Failed to fetch gyld member emails: ${error.message}`);
    }
    
    return (data || []).map((item: any) => item.users_private.email).filter(Boolean);
  }
  
  // Fetch dynamic content data and render templates
  private async fetchContentData(contentSource: NonNullable<EmailServiceInputs['content_source']>): Promise<DynamicContentData> {
    console.log('EmailService: Fetching dynamic content data', { sources: contentSource.dynamic_data_sources });
    
    const dynamicData: DynamicContentData = {};
    
    try {
      // Fetch gathering data if requested
      if (contentSource.dynamic_data_sources.gathering_id) {
        dynamicData.gathering = await this.fetchGatheringData(contentSource.dynamic_data_sources.gathering_id);
      }
      
      // Fetch user data if requested
      if (contentSource.dynamic_data_sources.user_id) {
        dynamicData.user = await this.fetchUserData(contentSource.dynamic_data_sources.user_id);
      }
      
      // Fetch candidate data if requested
      if (contentSource.dynamic_data_sources.candidate_id) {
        dynamicData.candidate = await this.fetchCandidateData(contentSource.dynamic_data_sources.candidate_id);
      }
      
      return dynamicData;
    } catch (error) {
      console.error('EmailService: Error fetching dynamic content data', error);
      throw new Error(`Failed to fetch content data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Fetch gathering data
  private async fetchGatheringData(gatheringId: string): Promise<GatheringDynamicData> {
    const { data, error } = await supabase
      .from('gatherings')
      .select(`
        id, 
        title,
        description,
        date_time,
        gathering_displays!inner(location),
        participation_gatherings(id)
      `)
      .eq('id', gatheringId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch gathering data: ${error.message}`);
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date_time: data.date_time,
      location: (data.gathering_displays as any)?.location,
      attendee_count: (data.participation_gatherings || []).length
    };
  }
  
  // Fetch user data
  private async fetchUserData(userId: string): Promise<DynamicContentData['user']> {
    const { data, error } = await supabase
      .from('users_private')
      .select('user_id, email, first_name')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
    
    return {
      id: data.user_id,
      first_name: data.first_name,
      email: data.email
    };
  }
  
  // Fetch candidate data
  private async fetchCandidateData(candidateId: string): Promise<DynamicContentData['candidate']> {
    const { data, error } = await supabase
      .from('candidates')
      .select('id, first_name, status')
      .eq('id', candidateId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch candidate data: ${error.message}`);
    }
    
    return {
      id: data.id,
      first_name: data.first_name,
      status: data.status
    };
  }

  private validateInputs(inputs: EmailServiceInputs): void {
    // Required field validation
    if (!inputs.template_name) throw new Error('template_name is required');
    if (!inputs.email_type) throw new Error('email_type is required');
    if (!inputs.sender_fullname) throw new Error('sender_fullname is required');
    if (!inputs.send_date) throw new Error('send_date is required');
    if (!inputs.initiated_by) throw new Error('initiated_by is required');
    
    // Recipient validation - must have either static recipients OR dynamic source
    if (!inputs.to_address && !inputs.recipient_source) {
      throw new Error('Either to_address or recipient_source is required');
    }
    
    if (inputs.to_address && inputs.to_address.length === 0) {
      throw new Error('to_address must contain at least one email when provided');
    }
    
    // Content validation - must have either static content OR dynamic source
    if (!inputs.subject && !inputs.content_source) {
      throw new Error('Either subject or content_source is required');
    }
    
    if (!inputs.body1 && !inputs.content_source) {
      throw new Error('Either body1 or content_source is required');
    }
    
    // Validate dynamic sources if provided
    if (inputs.recipient_source) {
      this.validateRecipientSource(inputs.recipient_source);
    }
    
    if (inputs.content_source) {
      this.validateContentSource(inputs.content_source);
    }

    // Email validation for static recipients
    if (inputs.to_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      inputs.to_address.forEach(email => {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid email address: ${email}`);
        }
      });
    }

    // Optional email validation
    if (inputs.cc_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      inputs.cc_address.forEach(email => {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid CC email address: ${email}`);
        }
      });
    }

    if (inputs.bcc_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      inputs.bcc_address.forEach(email => {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid BCC email address: ${email}`);
        }
      });
    }

    if (inputs.reply_to_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputs.reply_to_address)) {
        throw new Error(`Invalid reply-to email address: ${inputs.reply_to_address}`);
      }
    }
  }

  // Validate recipient source configuration
  private validateRecipientSource(recipientSource: NonNullable<EmailServiceInputs['recipient_source']>): void {
    switch (recipientSource.type) {
      case 'rsvp_list':
        if (!recipientSource.gathering_id) {
          throw new Error('gathering_id is required for rsvp_list recipient source');
        }
        break;
        
      case 'user_ids':
        if (!recipientSource.user_ids || recipientSource.user_ids.length === 0) {
          throw new Error('user_ids array is required and must not be empty for user_ids recipient source');
        }
        break;
        
      case 'gyld_members':
        if (!recipientSource.gyld_id) {
          throw new Error('gyld_id is required for gyld_members recipient source');
        }
        break;
        
      case 'static_emails':
        if (!recipientSource.static_emails || recipientSource.static_emails.length === 0) {
          throw new Error('static_emails array is required and must not be empty for static_emails recipient source');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        recipientSource.static_emails.forEach(email => {
          if (!emailRegex.test(email)) {
            throw new Error(`Invalid email address in static_emails: ${email}`);
          }
        });
        break;
        
      default:
        throw new Error(`Unknown recipient source type: ${(recipientSource as any).type}`);
    }
  }

  // Validate content source configuration
  private validateContentSource(contentSource: NonNullable<EmailServiceInputs['content_source']>): void {
    if (!contentSource.template_key) {
      throw new Error('template_key is required for content_source');
    }
    
    if (!contentSource.dynamic_data_sources) {
      throw new Error('dynamic_data_sources is required for content_source');
    }
    
    // At least one data source must be specified
    const hasDataSource = contentSource.dynamic_data_sources.gathering_id || 
                         contentSource.dynamic_data_sources.user_id || 
                         contentSource.dynamic_data_sources.candidate_id;
    
    if (!hasDataSource) {
      throw new Error('At least one dynamic_data_source must be specified (gathering_id, user_id, or candidate_id)');
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(); 