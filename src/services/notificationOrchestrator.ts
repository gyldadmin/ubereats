import { getPushNotificationLogo, shouldIncludePushLogo } from '../constants/branding';
import type { EmailServiceInputs } from '../types/email';
import type {
    OrchestrationInputs,
    OrchestrationResponse
} from '../types/orchestration';
import type { PushServiceInputs } from '../types/push';
import { getProcessedContentTemplate } from './contentTemplateService';
import { EmailService } from './emailService';
import { PushService } from './pushService';
import type { Repositories } from './repositories';
import { supabase } from './supabase';

// Re-export types from repositories for backward compatibility
import type {
    StatusOptionLookup,
    UserEmailInfo,
    WorkflowTypeLookup
} from './repositories';

export class NotificationOrchestrator {
  private emailService: EmailService;
  private pushService: PushService;
  private repositories: Repositories;
  private scheduledOrchestrations: Map<string, number> = new Map(); // workflowId -> timeoutId

  constructor(
    emailService?: EmailService,
    pushService?: PushService,
    repositories?: Repositories
  ) {
    // Use provided services or create defaults (for dependency injection)
    this.emailService = emailService || new EmailService();
    this.pushService = pushService || new PushService();
    
    // Import repositories if not provided
    if (repositories) {
      this.repositories = repositories;
    } else {
      // Dynamic import to avoid circular dependencies
      this.initializeRepositories();
    }
  }

  /**
   * Initialize repositories dynamically to avoid circular dependencies
   */
  private async initializeRepositories(): Promise<void> {
    const { repositories } = await import('./repositories');
    this.repositories = repositories;
  }

  /**
   * Ensure repositories are initialized before use
   */
  private async ensureRepositories(): Promise<void> {
    if (!this.repositories) {
      await this.initializeRepositories();
    }
  }

  /**
   * Main entry point for orchestrated notifications
   */
  public async send(inputs: OrchestrationInputs): Promise<OrchestrationResponse> {
    try {
      console.log('NotificationOrchestrator: Processing orchestration request', {
        mode: inputs.mode,
        users: inputs.users,
        title: inputs.title,
        sendDate: inputs.send_date.toISOString()
      });

      // Validate inputs
      this.validateInputs(inputs);

      // Check if this should be sent immediately or scheduled
      const now = new Date();
      const sendDate = new Date(inputs.send_date);

      if (sendDate <= now) {
        // Send immediately
        return await this.sendImmediately(inputs);
      } else {
        // Schedule for future delivery
        return await this.scheduleOrchestration(inputs);
      }
    } catch (error) {
      console.error('NotificationOrchestrator: Error processing orchestration request', error);
      return {
        success: false,
        message: 'Failed to process orchestration request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send orchestrated notification immediately
   */
  private async sendImmediately(inputs: OrchestrationInputs): Promise<OrchestrationResponse> {
    console.log('NotificationOrchestrator: Sending orchestration immediately', { mode: inputs.mode });

    const response: OrchestrationResponse = {
      success: false,
      message: '',
      push_results: {
        attempted: false,
        success: false,
        sent_count: 0,
        failed_count: 0,
        failed_users: []
      },
      email_results: {
        attempted: false,
        success: false,
        sent_count: 0,
        failed_count: 0
      }
    };

    try {
      // Process content templates if provided
      const processedContent = await this.processContentTemplates(inputs);

      if (inputs.mode === 'push_preferred') {
        // Try push first, fallback to email for failed users
        await this.handlePushPreferredMode(inputs, processedContent, response);
      } else if (inputs.mode === 'both') {
        // Send both push and email
        await this.handleBothMode(inputs, processedContent, response);
      }

      // Determine overall success
      const hasSuccessfulPush = response.push_results?.success && response.push_results.sent_count > 0;
      const hasSuccessfulEmail = response.email_results?.success && response.email_results.sent_count > 0;
      
      response.success = hasSuccessfulPush || hasSuccessfulEmail;
      response.message = this.buildResponseMessage(response);

      return response;
    } catch (error) {
      console.error('NotificationOrchestrator: Error in sendImmediately', error);
      response.error = error instanceof Error ? error.message : 'Unknown error';
      response.message = 'Failed to send orchestrated notification';
      return response;
    }
  }

  /**
   * Handle push_preferred mode: try push first, email for failures
   */
  private async handlePushPreferredMode(
    inputs: OrchestrationInputs,
    processedContent: { pushContent: any, emailContent: any },
    response: OrchestrationResponse
  ): Promise<void> {
    console.log('NotificationOrchestrator: Handling push_preferred mode');

    // Try push notification first
    const pushInputs = this.mapToPushInputs(inputs, processedContent.pushContent);
    const pushResult = await this.pushService.send(pushInputs);

    response.push_results = {
      attempted: true,
      success: pushResult.success,
      sent_count: pushInputs.users.length - (pushResult.failedUsers?.length || 0),
      failed_count: pushResult.failedUsers?.length || 0,
      failed_users: pushResult.failedUsers || [],
      error: pushResult.error,
      ticketIds: pushResult.ticketIds
    };

    // For users who failed to receive push, send email as fallback
    const failedPushUsers = pushResult.failedUsers || [];
    if (failedPushUsers.length > 0) {
      console.log('NotificationOrchestrator: Sending email fallback for failed push users', {
        failedCount: failedPushUsers.length
      });

      try {
        // Get user email addresses for failed push users
        const userEmails = await this.getUserEmails(failedPushUsers);
        
        if (userEmails.length > 0) {
          const emailInputs = await this.mapToEmailInputs(
            { ...inputs, users: failedPushUsers }, 
            processedContent.emailContent, 
            userEmails
          );
          
          const emailResult = await this.emailService.send(emailInputs);

          response.email_results = {
            attempted: true,
            success: emailResult.success,
            sent_count: emailResult.success ? userEmails.length : 0,
            failed_count: emailResult.success ? 0 : userEmails.length,
            error: emailResult.error,
            emailId: emailResult.emailId
          };
        }
      } catch (emailError) {
        console.error('NotificationOrchestrator: Error sending email fallback', emailError);
        response.email_results = {
          attempted: true,
          success: false,
          sent_count: 0,
          failed_count: failedPushUsers.length,
          error: emailError instanceof Error ? emailError.message : 'Unknown email error'
        };
      }
    }
  }

  /**
   * Handle both mode: send push and email to all users
   */
  private async handleBothMode(
    inputs: OrchestrationInputs,
    processedContent: { pushContent: any, emailContent: any },
    response: OrchestrationResponse
  ): Promise<void> {
    console.log('NotificationOrchestrator: Handling both mode');

    // Send push to all users (best effort)
    const pushInputs = this.mapToPushInputs(inputs, processedContent.pushContent);
    const pushResult = await this.pushService.send(pushInputs);

    response.push_results = {
      attempted: true,
      success: pushResult.success,
      sent_count: pushInputs.users.length - (pushResult.failedUsers?.length || 0),
      failed_count: pushResult.failedUsers?.length || 0,
      failed_users: pushResult.failedUsers || [],
      error: pushResult.error,
      ticketIds: pushResult.ticketIds
    };

    // Send email to all users regardless of push success
    try {
      const userEmails = await this.getUserEmails(inputs.users);
      
      if (userEmails.length > 0) {
        const emailInputs = await this.mapToEmailInputs(inputs, processedContent.emailContent, userEmails);
        const emailResult = await this.emailService.send(emailInputs);

        response.email_results = {
          attempted: true,
          success: emailResult.success,
          sent_count: emailResult.success ? userEmails.length : 0,
          failed_count: emailResult.success ? 0 : userEmails.length,
          error: emailResult.error,
          emailId: emailResult.emailId
        };
      }
    } catch (emailError) {
      console.error('NotificationOrchestrator: Error sending email in both mode', emailError);
      response.email_results = {
        attempted: true,
        success: false,
        sent_count: 0,
        failed_count: inputs.users.length,
        error: emailError instanceof Error ? emailError.message : 'Unknown email error'
      };
    }
  }

  /**
   * Schedule orchestration for future delivery
   */
  private async scheduleOrchestration(inputs: OrchestrationInputs): Promise<OrchestrationResponse> {
    console.log('NotificationOrchestrator: Scheduling orchestration for future delivery');

    // Generate unique workflow ID
    const workflowId = this.generateWorkflowId();

    // Determine workflow type based on mode
    const workflowTypeLabel = inputs.mode === 'push_preferred' ? 'orchestration_push_preferred' : 'orchestration_both';
    
    // Get status option ID for "pending" and orchestration workflow type
    const [pendingStatus, orchestrationWorkflowType] = await Promise.all([
      this.lookupStatusOption('pending'),
      this.lookupOrCreateWorkflowType(workflowTypeLabel)
    ]);

    // Store full OrchestrationInputs in workflow_data as JSON
    const workflowData = {
      ...inputs,
      // Ensure send_date is stored as ISO string for JSON serialization
      send_date: new Date(inputs.send_date).toISOString()
    };

    // Create planned_workflows record with workflow_data using repository
    await this.ensureRepositories();
    await this.repositories.workflowRepository.createWorkflow({
      status: pendingStatus.id,
      gathering_id: inputs.gathering_ID || null,
      candidate_id: inputs.candidate_ID || null,
      workflow_id: workflowId,
      workflow_type: orchestrationWorkflowType.id,
      workflow_data: workflowData,
      description: `orchestration_${inputs.mode}`
    });

    // Calculate delay in milliseconds
    const now = new Date();
    const sendDate = new Date(inputs.send_date);
    const delayMs = sendDate.getTime() - now.getTime();

    // Schedule the orchestration using setTimeout
    const timeoutId = setTimeout(async () => {
      try {
        await this.executeScheduledOrchestration(workflowId);
      } catch (error) {
        console.error('NotificationOrchestrator: Error executing scheduled orchestration', { workflowId, error });
      }
    }, delayMs) as unknown as number;

    // Store timeout reference for potential cancellation
    this.scheduledOrchestrations.set(workflowId, timeoutId);

    console.log('NotificationOrchestrator: Orchestration scheduled successfully', {
      workflowId,
      scheduledFor: sendDate.toISOString(),
      delayMs
    });

    return {
      success: true,
      message: `Orchestration scheduled for ${sendDate.toISOString()}`,
      workflowId: workflowId
    };
  }

  /**
   * Execute a scheduled orchestration
   */
  private async executeScheduledOrchestration(workflowId: string): Promise<void> {
    console.log('NotificationOrchestrator: Executing scheduled orchestration', { workflowId });

    try {
      // Fetch workflow data including the stored OrchestrationInputs
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
        console.error('NotificationOrchestrator: Failed to lookup workflow status', { workflowId, error: workflowError });
        return;
      }

      const statusLabel = (workflowData.status_options as any).label;
      
      if (statusLabel !== 'pending') {
        console.log('NotificationOrchestrator: Workflow no longer pending, skipping orchestration', {
          workflowId,
          currentStatus: statusLabel
        });
        return;
      }

      // Extract OrchestrationInputs from workflow_data
      if (!workflowData.workflow_data) {
        console.error('NotificationOrchestrator: No workflow_data found for scheduled orchestration', { workflowId });
        return;
      }

      // Deserialize the OrchestrationInputs from JSON
      const inputs: OrchestrationInputs = {
        ...workflowData.workflow_data,
        // Convert send_date back to Date object
        send_date: new Date(workflowData.workflow_data.send_date)
      };

      console.log('NotificationOrchestrator: Retrieved inputs from workflow_data for scheduled orchestration', {
        workflowId,
        inputsPreview: {
          mode: inputs.mode,
          title: inputs.title,
          users: inputs.users
        }
      });

      // Send the orchestration
      await this.sendImmediately(inputs);

      // Update workflow status to completed
      const completedStatus = await this.lookupStatusOption('completed');
      await supabase
        .from('planned_workflows')
        .update({ status: completedStatus.id })
        .eq('workflow_id', workflowId);

      // Clean up scheduled reference
      this.scheduledOrchestrations.delete(workflowId);

      console.log('NotificationOrchestrator: Scheduled orchestration completed successfully', { workflowId });
    } catch (error) {
      console.error('NotificationOrchestrator: Error in executeScheduledOrchestration', { workflowId, error });
      
      // Update workflow status to failed
      try {
        const failedStatus = await this.lookupStatusOption('failed');
        await supabase
          .from('planned_workflows')
          .update({ status: failedStatus.id })
          .eq('workflow_id', workflowId);
      } catch (statusError) {
        console.error('NotificationOrchestrator: Failed to update workflow status to failed', statusError);
      }
    }
  }

  /**
   * Process content templates for both push and email
   */
  private async processContentTemplates(inputs: OrchestrationInputs): Promise<{
    pushContent: any,
    emailContent: any
  }> {
    const defaultContent = {
      pushContent: {
        title1: inputs.title,
        title2: inputs.subtitle,
        content: inputs.content
      },
      emailContent: {
        subject: inputs.title,
        body1: inputs.content,
        body2: inputs.secondary_content
      }
    };

    if (!inputs.content_key || !inputs.template_variables) {
      return defaultContent;
    }

    console.log('NotificationOrchestrator: Processing content templates', {
      contentKey: inputs.content_key
    });

    try {
      // Fetch push and email templates with same content_key
      const [pushTemplate, emailTemplate] = await Promise.all([
        getProcessedContentTemplate(inputs.content_key, 'push', inputs.template_variables),
        getProcessedContentTemplate(inputs.content_key, 'email', inputs.template_variables)
      ]);

      return {
        pushContent: pushTemplate ? {
          title1: pushTemplate.processed_primary_text || inputs.title,
          title2: pushTemplate.processed_secondary_text || inputs.subtitle,
          content: pushTemplate.processed_tertiary_text || inputs.content
        } : defaultContent.pushContent,
        
        emailContent: emailTemplate ? {
          subject: emailTemplate.processed_primary_text || inputs.title,
          body1: emailTemplate.processed_secondary_text || inputs.content,
          body2: emailTemplate.processed_tertiary_text || inputs.secondary_content
        } : defaultContent.emailContent
      };
    } catch (error) {
      console.error('NotificationOrchestrator: Error processing content templates', error);
      return defaultContent;
    }
  }

  /**
   * Map orchestration inputs to push service inputs
   */
  private mapToPushInputs(inputs: OrchestrationInputs, pushContent: any): PushServiceInputs {
    return {
      title1: pushContent.title1,
      title2: pushContent.title2,
      content: pushContent.content,
      users: inputs.users,
      send_date: inputs.send_date,
      deep_link: inputs.deep_link,
      button1_text: inputs.button1_text,
      button1_url: inputs.button1_url,
      button2_text: inputs.button2_text,
      button2_url: inputs.button2_url,
      button3_text: inputs.button3_text,
      button3_url: inputs.button3_url,
      initiated_by: inputs.initiated_by,
      gathering_ID: inputs.gathering_ID,
      candidate_ID: inputs.candidate_ID,
      content_key: inputs.content_key,
      template_variables: inputs.template_variables,
      // Automatically include company logo in all push notifications
      ...(shouldIncludePushLogo() && {
        image_url: getPushNotificationLogo()
      })
    };
  }

  /**
   * Map orchestration inputs to email service inputs
   */
  private async mapToEmailInputs(
    inputs: OrchestrationInputs, 
    emailContent: any, 
    userEmails: UserEmailInfo[]
  ): Promise<EmailServiceInputs> {
    const emailAddresses = userEmails.map(u => u.email);
    
    // Use first user's first name if available for personalization
    const firstName = userEmails[0]?.first_name;

    return {
      template_name: inputs.email_template_name || 'basic_with_button',
      email_type: inputs.email_type || 'notification',
      sender_fullname: inputs.sender_fullname || 'Gyld Notifications',
      subject: emailContent.subject,
      body1: emailContent.body1,
      body2: emailContent.body2,
      to_address: emailAddresses,
      send_date: inputs.send_date,
      initiated_by: inputs.initiated_by,
      gathering_ID: inputs.gathering_ID,
      candidate_ID: inputs.candidate_ID,
      buttontext: inputs.button1_text,
      buttonurl: inputs.button1_url,
      unsubscribeurl: inputs.unsubscribe_url || 'https://app.gyld.org/unsubscribe',
      reply_to_address: inputs.reply_to_address || 'noreply@gyld.org',
      header_image: inputs.header_image,
      body_image: inputs.body_image,
      // Add personalization if available
      first: firstName
    };
  }

  /**
   * Get user email addresses for given user IDs
   */
  private async getUserEmails(userIds: string[]): Promise<UserEmailInfo[]> {
    await this.ensureRepositories();
    console.log('NotificationOrchestrator: Fetching user emails', { userCount: userIds.length });

    try {
      const userEmails = await this.repositories.userRepository.getUserEmails(userIds);
      
      console.log('NotificationOrchestrator: Valid user emails found', {
        total: userEmails.length,
        valid: userEmails.length
      });

      return userEmails;
    } catch (error) {
      console.error('NotificationOrchestrator: Error fetching user emails', error);
      return [];
    }
  }

  /**
   * Build response message based on results
   */
  private buildResponseMessage(response: OrchestrationResponse): string {
    const messages: string[] = [];

    if (response.push_results?.attempted) {
      if (response.push_results.success) {
        messages.push(`Push sent to ${response.push_results.sent_count} users`);
      } else {
        messages.push(`Push failed for all ${response.push_results.failed_count} users`);
      }
    }

    if (response.email_results?.attempted) {
      if (response.email_results.success) {
        messages.push(`Email sent to ${response.email_results.sent_count} users`);
      } else {
        messages.push(`Email failed for all ${response.email_results.failed_count} users`);
      }
    }

    return messages.join('; ') || 'No notifications sent';
  }

  /**
   * Lookup helper methods
   */
  private async lookupStatusOption(label: string): Promise<StatusOptionLookup> {
    await this.ensureRepositories();
    return await this.repositories.statusRepository.lookupStatusOption(label);
  }

  private async lookupOrCreateWorkflowType(label: string): Promise<WorkflowTypeLookup> {
    await this.ensureRepositories();
    return await this.repositories.workflowRepository.lookupOrCreateWorkflowType(label);
  }

  private generateWorkflowId(): string {
    // Generate UUID-like string for workflow tracking
    return 'orchestration_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private validateInputs(inputs: OrchestrationInputs): void {
    // Required field validation
    if (!inputs.mode) throw new Error('mode is required');
    if (!['push_preferred', 'both'].includes(inputs.mode)) throw new Error('mode must be push_preferred or both');
    if (!inputs.title) throw new Error('title is required');
    if (!inputs.content) throw new Error('content is required');
    if (!inputs.users || inputs.users.length === 0) throw new Error('users is required and must not be empty');
    if (!inputs.send_date) throw new Error('send_date is required');
    if (!inputs.initiated_by) throw new Error('initiated_by is required');
  }
}

// Export default instance for backward compatibility
export const notificationOrchestrator = new NotificationOrchestrator(); 