import { supabase } from './supabase';
import Constants from 'expo-constants';
import { 
  EmailServiceInputs, 
  EmailServiceResponse, 
  EmailTemplateLookup, 
  EmailAddressLookup, 
  NotificationTypeLookup, 
  StatusOptionLookup,
  SendGridPayload,
  SendGridPersonalization,
  ScheduledEmailRecord,
  NotificationSentRecord
} from '../types/email';

export class EmailService {
  private sendGridApiKey: string;
  private scheduledEmails: Map<string, number> = new Map();

  constructor() {
    // Load SendGrid API key from hidden file
    this.sendGridApiKey = this.loadSendGridApiKey();
  }

  /**
   * Main entry point for sending emails
   * Handles both immediate and scheduled emails
   */
  async send(inputs: EmailServiceInputs): Promise<EmailServiceResponse> {
    try {
      console.log('EmailService: Processing email request', {
        template: inputs.template_name,
        email_type: inputs.email_type,
        recipients: inputs.to_address.length,
        scheduled_for: inputs.send_date
      });

      // Validate inputs
      this.validateInputs(inputs);

      // Check if email should be sent immediately or scheduled
      const now = new Date();
      const sendDate = new Date(inputs.send_date);
      const isImmediate = sendDate <= now;

      if (isImmediate) {
        // Send immediately
        const emailId = await this.sendImmediately(inputs);
        return {
          success: true,
          message: 'Email sent successfully',
          emailId
        };
      } else {
        // Schedule for future delivery
        const workflowId = await this.scheduleEmail(inputs);
        return {
          success: true,
          message: `Email scheduled for ${sendDate.toISOString()}`,
          workflowId
        };
      }

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

      // Send via SendGrid API
      const emailId = await this.callSendGridApi(sendGridPayload);

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
   * Schedule email for future delivery
   */
  private async scheduleEmail(inputs: EmailServiceInputs): Promise<string> {
    console.log('EmailService: Scheduling email for future delivery');

    // Generate unique workflow ID
    const workflowId = this.generateWorkflowId();

    // Get status option ID for "pending" and email workflow type
    const [pendingStatus, emailWorkflowType] = await Promise.all([
      this.lookupStatusOption('pending'),
      this.lookupWorkflowType('email')
    ]);

    // Store full EmailServiceInputs in workflow_data as JSON
    const workflowData = {
      ...inputs,
      // Ensure send_date is stored as ISO string for JSON serialization
      send_date: new Date(inputs.send_date).toISOString()
    };

    // Create planned_workflows record with workflow_data
    const { error: workflowError } = await supabase
      .from('planned_workflows')
      .insert({
        status: pendingStatus.id,
        gathering_id: inputs.gathering_ID || null,
        candidate_id: inputs.candidate_ID || null,
        workflow_id: workflowId,
        workflow_type: emailWorkflowType.id,
        workflow_data: workflowData,
        description: 'email'
      });

    if (workflowError) {
      throw new Error(`Failed to create planned workflow: ${workflowError.message}`);
    }

    // Calculate delay in milliseconds
    const now = new Date();
    const sendDate = new Date(inputs.send_date);
    const delayMs = sendDate.getTime() - now.getTime();

    // Schedule the email using setTimeout for database-driven job queue
    const timeoutId = setTimeout(async () => {
      try {
        await this.executeScheduledEmail(workflowId);
      } catch (error) {
        console.error('EmailService: Error executing scheduled email', { workflowId, error });
      }
    }, delayMs) as unknown as number;

    // Store timeout reference for potential cancellation
    this.scheduledEmails.set(workflowId, timeoutId);

    console.log('EmailService: Email scheduled successfully', { 
      workflowId, 
      scheduledFor: sendDate.toISOString(),
      delayMs 
    });

    return workflowId;
  }

  /**
   * Execute a scheduled email (called by setTimeout)
   */
  private async executeScheduledEmail(workflowId: string): Promise<void> {
    console.log('EmailService: Executing scheduled email', { workflowId });

    try {
      // Fetch workflow data including the stored EmailServiceInputs
      const { data: workflowData, error: workflowError } = await supabase
        .from('planned_workflows')
        .select(`
          status,
          workflow_data,
          status_options!inner(label)
        `)
        .eq('workflow_id', workflowId)
        .single();

      if (workflowError) {
        console.error('EmailService: Failed to lookup workflow status', { workflowId, error: workflowError });
        return;
      }

      const statusLabel = (workflowData.status_options as any).label;
      
      if (statusLabel !== 'pending') {
        console.log('EmailService: Workflow no longer pending, skipping email', { 
          workflowId, 
          currentStatus: statusLabel 
        });
        return;
      }

      // Extract EmailServiceInputs from workflow_data
      if (!workflowData.workflow_data) {
        console.error('EmailService: No workflow_data found for scheduled email', { workflowId });
        return;
      }

      // Deserialize the EmailServiceInputs from JSON
      const inputs: EmailServiceInputs = {
        ...workflowData.workflow_data,
        // Convert send_date back to Date object
        send_date: new Date(workflowData.workflow_data.send_date)
      };

      console.log('EmailService: Retrieved inputs from workflow_data for scheduled email', { 
        workflowId, 
        inputsPreview: {
          template_name: inputs.template_name,
          email_type: inputs.email_type,
          subject: inputs.subject,
          to_address: inputs.to_address
        }
      });

      // Send the email
      await this.sendImmediately(inputs);

      // Update workflow status to completed
      const completedStatus = await this.lookupStatusOption('completed');
      await supabase
        .from('planned_workflows')
        .update({ status: completedStatus.id })
        .eq('workflow_id', workflowId);

      console.log('EmailService: Scheduled email executed successfully', { workflowId });

    } catch (error) {
      console.error('EmailService: Error executing scheduled email', { workflowId, error });
      
      // Update workflow status to failed (we'll use 'cancelled' as there's no 'failed' status)
      try {
        const cancelledStatus = await this.lookupStatusOption('cancelled');
        await supabase
          .from('planned_workflows')
          .update({ status: cancelledStatus.id })
          .eq('workflow_id', workflowId);
      } catch (statusError) {
        console.error('EmailService: Failed to update workflow status after error', { workflowId, statusError });
      }
    } finally {
      // Clean up the timeout reference
      this.scheduledEmails.delete(workflowId);
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(workflowId: string): Promise<boolean> {
    try {
      console.log('EmailService: Cancelling scheduled email', { workflowId });

      // Clear the timeout if it exists
      const timeoutId = this.scheduledEmails.get(workflowId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.scheduledEmails.delete(workflowId);
      }

      // Update database status to cancelled
      const cancelledStatus = await this.lookupStatusOption('cancelled');
      const { error } = await supabase
        .from('planned_workflows')
        .update({ status: cancelledStatus.id })
        .eq('workflow_id', workflowId);

      if (error) {
        console.error('EmailService: Failed to update workflow status to cancelled', { workflowId, error });
        return false;
      }

      console.log('EmailService: Successfully cancelled scheduled email', { workflowId });
      return true;

    } catch (error) {
      console.error('EmailService: Error cancelling scheduled email', { workflowId, error });
      return false;
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
   * Process pending email workflows from database
   * Useful for handling missed scheduled emails after app restart
   */
  public async processPendingWorkflows(): Promise<void> {
    console.log('EmailService: Processing pending email workflows from database');
    
    try {
      // Query for pending email workflows that are past due
      const { data: pendingWorkflows, error } = await supabase
        .from('planned_workflows')
        .select(`
          workflow_id,
          workflow_data,
          created_at,
          status_options!inner(label),
          workflow_type!inner(label)
        `)
        .eq('status_options.label', 'pending')
        .eq('workflow_type.label', 'email');

      if (error) {
        console.error('EmailService: Failed to fetch pending workflows', error);
        return;
      }

      if (!pendingWorkflows?.length) {
        console.log('EmailService: No pending email workflows found');
        return;
      }

      console.log(`EmailService: Found ${pendingWorkflows.length} pending email workflows`);

      // Process each pending workflow
      for (const workflow of pendingWorkflows) {
        try {
          if (!workflow.workflow_data) {
            console.warn('EmailService: Skipping workflow with no workflow_data', { 
              workflowId: workflow.workflow_id 
            });
            continue;
          }

          // Check if email is past due
          const sendDate = new Date(workflow.workflow_data.send_date);
          const now = new Date();
          
          if (sendDate <= now) {
            // Email is past due, send immediately
            console.log('EmailService: Processing overdue email workflow', { 
              workflowId: workflow.workflow_id,
              scheduledFor: sendDate.toISOString(),
              overdueMins: Math.round((now.getTime() - sendDate.getTime()) / (1000 * 60))
            });
            
            await this.executeScheduledEmail(workflow.workflow_id);
          } else {
            // Email is not yet due, reschedule it
            const delayMs = sendDate.getTime() - now.getTime();
            console.log('EmailService: Rescheduling future email workflow', { 
              workflowId: workflow.workflow_id,
              scheduledFor: sendDate.toISOString(),
              delayMins: Math.round(delayMs / (1000 * 60))
            });

            const timeoutId = setTimeout(async () => {
              try {
                await this.executeScheduledEmail(workflow.workflow_id);
              } catch (error) {
                console.error('EmailService: Error executing rescheduled email', { 
                  workflowId: workflow.workflow_id, 
                  error 
                });
              }
            }, delayMs) as unknown as number;

            // Store timeout reference for potential cancellation
            this.scheduledEmails.set(workflow.workflow_id, timeoutId);
          }
        } catch (workflowError) {
          console.error('EmailService: Error processing workflow', { 
            workflowId: workflow.workflow_id, 
            error: workflowError 
          });
        }
      }
    } catch (error) {
      console.error('EmailService: Error in processPendingWorkflows', error);
    }
  }

  private generateWorkflowId(): string {
    // Generate UUID-like string for workflow tracking
    return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private validateInputs(inputs: EmailServiceInputs): void {
    // Required field validation
    if (!inputs.template_name) throw new Error('template_name is required');
    if (!inputs.email_type) throw new Error('email_type is required');
    if (!inputs.sender_fullname) throw new Error('sender_fullname is required');
    if (!inputs.subject) throw new Error('subject is required');
    if (!inputs.body1) throw new Error('body1 is required');
    if (!inputs.to_address || inputs.to_address.length === 0) throw new Error('to_address is required and must not be empty');
    if (!inputs.send_date) throw new Error('send_date is required');
    if (!inputs.initiated_by) throw new Error('initiated_by is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    inputs.to_address.forEach(email => {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    });

    // Optional email validation
    if (inputs.cc_address) {
      inputs.cc_address.forEach(email => {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid CC email address: ${email}`);
        }
      });
    }

    if (inputs.bcc_address) {
      inputs.bcc_address.forEach(email => {
        if (!emailRegex.test(email)) {
          throw new Error(`Invalid BCC email address: ${email}`);
        }
      });
    }

    if (inputs.reply_to_address && !emailRegex.test(inputs.reply_to_address)) {
      throw new Error(`Invalid reply-to email address: ${inputs.reply_to_address}`);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService(); 