/**
 * Task Handler System for CentralScheduler
 * 
 * This system provides a standardized way to execute different types of scheduled tasks
 * by routing them to appropriate service handlers.
 */

import type { EmailServiceInputs, EmailServiceResponse } from '../types/email';
import type { OrchestrationInputs, OrchestrationResponse } from '../types/orchestration';
import {
    preparePersonalizedData,
    processPersonalizedContentTemplate
} from './contentTemplateService';

/**
 * Result of executing a task
 */
export interface TaskExecutionResult {
  success: boolean;
  message: string;
  error?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

/**
 * Standard interface that all task handlers must implement
 */
export interface TaskHandler {
  /**
   * Execute a task with the provided data
   * @param data - Task-specific data payload
   * @returns Promise resolving to execution result
   */
  execute(data: any): Promise<TaskExecutionResult>;
  
  /**
   * Optional: Get handler name for logging/debugging
   */
  getName?(): string;
}

/**
 * Registry for managing task handlers
 * Maps task types to their corresponding handlers
 */
class TaskHandlerRegistryClass {
  private handlers = new Map<string, TaskHandler>();

  /**
   * Register a handler for a specific task type
   */
  register(taskType: string, handler: TaskHandler): void {
    if (this.handlers.has(taskType)) {
      console.warn(`TaskHandlerRegistry: Overwriting existing handler for task type: ${taskType}`);
    }
    
    this.handlers.set(taskType, handler);
    console.log(`TaskHandlerRegistry: Registered handler for task type: ${taskType}`, {
      handlerName: handler.getName?.() || 'Unknown'
    });
  }

  /**
   * Execute a task using the appropriate registered handler
   */
  async execute(taskType: string, data: any): Promise<TaskExecutionResult> {
    const handler = this.handlers.get(taskType);
    
    if (!handler) {
      const availableTypes = Array.from(this.handlers.keys()).join(', ');
      return {
        success: false,
        message: `No handler registered for task type: ${taskType}`,
        error: `Available task types: ${availableTypes || 'none'}`
      };
    }

    try {
      console.log(`TaskHandlerRegistry: Executing task type: ${taskType}`, {
        handlerName: handler.getName?.() || 'Unknown',
        dataKeys: Object.keys(data || {})
      });

      const result = await handler.execute(data);
      
      console.log(`TaskHandlerRegistry: Task execution completed`, {
        taskType,
        success: result.success,
        message: result.message
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`TaskHandlerRegistry: Task execution failed for type: ${taskType}`, error);
      
      return {
        success: false,
        message: `Handler execution failed: ${errorMessage}`,
        error: errorMessage
      };
    }
  }

  /**
   * Check if a handler is registered for a task type
   */
  hasHandler(taskType: string): boolean {
    return this.handlers.has(taskType);
  }

  /**
   * Get all registered task types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler statistics
   */
  getStats(): {
    totalHandlers: number;
    registeredTypes: string[];
  } {
    return {
      totalHandlers: this.handlers.size,
      registeredTypes: this.getRegisteredTypes()
    };
  }

  /**
   * Unregister a handler (useful for testing)
   */
  unregister(taskType: string): boolean {
    const wasRemoved = this.handlers.delete(taskType);
    if (wasRemoved) {
      console.log(`TaskHandlerRegistry: Unregistered handler for task type: ${taskType}`);
    }
    return wasRemoved;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    const count = this.handlers.size;
    this.handlers.clear();
    console.log(`TaskHandlerRegistry: Cleared all handlers (removed ${count} handlers)`);
  }
}

// Export singleton instance
export const TaskHandlerRegistry = new TaskHandlerRegistryClass();

/**
 * Base class for task handlers (optional convenience class)
 */
export abstract class BaseTaskHandler implements TaskHandler {
  protected handlerName: string;

  constructor(handlerName: string) {
    this.handlerName = handlerName;
  }

  getName(): string {
    return this.handlerName;
  }

  abstract execute(data: any): Promise<TaskExecutionResult>;

  /**
   * Helper method for creating success results
   */
  protected createSuccessResult(message: string, metadata?: Record<string, any>): TaskExecutionResult {
    return {
      success: true,
      message,
      metadata
    };
  }

  /**
   * Helper method for creating failure results
   */
  protected createFailureResult(message: string, error?: string, metadata?: Record<string, any>): TaskExecutionResult {
    return {
      success: false,
      message,
      error,
      metadata
    };
  }
}

/**
 * Simple test handler for logging messages
 * Used for testing the handler system without external dependencies
 */
export class LogMessageHandler extends BaseTaskHandler {
  constructor() {
    super('LogMessageHandler');
  }

  async execute(data: any): Promise<TaskExecutionResult> {
    try {
      // Validate data
      if (!data || typeof data !== 'object') {
        return this.createFailureResult(
          'Invalid data: expected object with message field',
          'Data must be an object'
        );
      }

      const { message, level = 'info', timestamp } = data;

      if (!message || typeof message !== 'string') {
        return this.createFailureResult(
          'Invalid data: message field is required and must be a string',
          'Missing or invalid message field'
        );
      }

      // Log the message with appropriate level
      const logMessage = `[${level.toUpperCase()}] ${message}`;
      const logTimestamp = timestamp || new Date().toISOString();
      
      console.log(`LogMessageHandler: ${logMessage}`, {
        timestamp: logTimestamp,
        level,
        originalData: data
      });

      return this.createSuccessResult(
        `Message logged successfully: "${message}"`,
        {
          loggedAt: logTimestamp,
          level,
          messageLength: message.length
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createFailureResult(
        'Failed to log message',
        errorMessage
      );
    }
  }
}

/**
 * EmailHandler - Handles email sending tasks through EmailService
 * 
 * Purpose: Route scheduled email tasks to the EmailService for actual email delivery
 * Expected Data: EmailServiceInputs object with all required email fields
 * Success: Returns success with emailId or workflowId from EmailService
 * Failure: Returns error details from EmailService or validation failures
 */
export class EmailHandler extends BaseTaskHandler {
  private emailService: any; // Use any to avoid import issues

  constructor(emailService?: any) {
    super('EmailHandler');
    // Use provided emailService (for testing) or create a new one dynamically
    this.emailService = emailService;
  }

  private async getEmailService(): Promise<any> {
    if (!this.emailService) {
      // Dynamically import EmailService to avoid module-level instantiation
      const { EmailService } = await import('./emailService');
      this.emailService = new EmailService();
    }
    return this.emailService;
  }

  async execute(data: any): Promise<TaskExecutionResult> {
    try {
      // Validate that data is an EmailServiceInputs object
      if (!data || typeof data !== 'object') {
        return this.createFailureResult(
          'Invalid email data: expected EmailServiceInputs object',
          'Data must be a valid EmailServiceInputs object'
        );
      }

      // Check for required fields
      const requiredFields = ['template_name', 'email_type', 'sender_fullname', 'subject', 'body1', 'send_date'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return this.createFailureResult(
          `Invalid email data: missing required fields: ${missingFields.join(', ')}`,
          `Missing fields: ${missingFields.join(', ')}`
        );
      }

      // Ensure recipients are specified (either static or dynamic)
      if (!data.to_address && !data.recipient_source) {
        return this.createFailureResult(
          'Invalid email data: must specify either to_address or recipient_source',
          'No recipients specified'
        );
      }

      console.log('EmailHandler: Processing email task', {
        template: data.template_name,
        email_type: data.email_type,
        hasStaticRecipients: !!data.to_address,
        hasDynamicRecipients: !!data.recipient_source,
        scheduledFor: data.send_date
      });

      // Get EmailService instance and send the email
      const emailService = await this.getEmailService();
      const emailInputs: EmailServiceInputs = data;
      const emailResult: EmailServiceResponse = await emailService.send(emailInputs);

      if (emailResult.success) {
        const metadata = {
          emailId: emailResult.emailId,
          workflowId: emailResult.workflowId,
          template: data.template_name,
          email_type: data.email_type,
          processedAt: new Date().toISOString()
        };

        console.log('EmailHandler: Email sent successfully', metadata);

        return this.createSuccessResult(
          emailResult.message,
          metadata
        );
      } else {
        console.error('EmailHandler: Email sending failed', {
          error: emailResult.error,
          message: emailResult.message
        });

        return this.createFailureResult(
          emailResult.message,
          emailResult.error || 'Unknown email service error'
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('EmailHandler: Unexpected error during email processing', error);
      
      return this.createFailureResult(
        'Email handler execution failed',
        errorMessage
      );
    }
  }
}

/**
 * IndividualEmailHandler - Handles personalized email sending for individual recipients
 * 
 * Purpose: Process email tasks with individual messaging mode, sending personalized emails to each recipient
 * Expected Data: EmailServiceInputs with send_individual_messages=true and per_user_variables array
 * Success: Returns success with count of individual emails sent and any failures
 * Failure: Returns error details from template processing or email sending failures
 */
export class IndividualEmailHandler extends BaseTaskHandler {
  private emailService: any; // Use any to avoid import issues

  constructor(emailService?: any) {
    super('IndividualEmailHandler');
    // Use provided emailService (for testing) or create a new one dynamically
    this.emailService = emailService;
  }

  private async getEmailService(): Promise<any> {
    if (!this.emailService) {
      // Dynamically import EmailService to avoid module-level instantiation
      const { EmailService } = await import('./emailService');
      this.emailService = new EmailService();
    }
    return this.emailService;
  }

  async execute(data: any): Promise<TaskExecutionResult> {
    try {
      // Validate that data is an EmailServiceInputs object with individual messaging
      if (!data || typeof data !== 'object') {
        return this.createFailureResult(
          'Invalid email data: expected EmailServiceInputs object',
          'Data must be a valid EmailServiceInputs object'
        );
      }

      // Verify this is an individual messaging request
      if (!data.send_individual_messages) {
        return this.createFailureResult(
          'Invalid request: IndividualEmailHandler requires send_individual_messages=true',
          'Use regular EmailHandler for bulk messaging'
        );
      }

      // Validate per_user_variables
      if (!data.per_user_variables || !Array.isArray(data.per_user_variables) || data.per_user_variables.length === 0) {
        return this.createFailureResult(
          'Invalid email data: per_user_variables array is required for individual messaging',
          'per_user_variables must be a non-empty array'
        );
      }

      // Check for required fields
      const requiredFields = ['template_name', 'email_type', 'sender_fullname', 'subject', 'body1', 'send_date'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return this.createFailureResult(
          `Invalid email data: missing required fields: ${missingFields.join(', ')}`,
          `Missing fields: ${missingFields.join(', ')}`
        );
      }

      console.log('IndividualEmailHandler: Processing individual email task', {
        template: data.template_name,
        email_type: data.email_type,
        recipientCount: data.per_user_variables.length,
        scheduledFor: data.send_date
      });

      // Step 1: Fetch user emails for the user IDs
      const userIds = data.per_user_variables.map((userVar: any) => userVar.user_id);
      const userEmails = await this.fetchUserEmails(userIds);

      if (userEmails.length !== userIds.length) {
        return this.createFailureResult(
          'Failed to fetch all user emails',
          `Expected ${userIds.length} emails, got ${userEmails.length}`
        );
      }

      // Step 2: Prepare global variables for template processing
      const globalVariables = {
        gathering_title: data.gathering_title || '',
        host_name: data.host_name || '',
        gathering_date: data.gathering_date || '',
        gathering_location: data.gathering_location || '',
        attendee_count: data.attendee_count || 0,
        // Add any other global template variables from the email data
        ...(data.template_variables || {})
      };

      // Step 3: Prepare personalized data for template processing
      const personalizedData = preparePersonalizedData(
        userIds,
        userEmails,
        data.per_user_variables,
        globalVariables
      );

      // Step 4: Process personalized templates
      const templateResults = await processPersonalizedContentTemplate(
        data.template_name,
        'email', // content_type
        globalVariables,
        personalizedData
      );

      // Step 5: Send individual emails
      const emailService = await this.getEmailService();
      const emailResults: Array<{ user_id: string; success: boolean; error?: string; emailId?: string }> = [];
      let successCount = 0;
      let failureCount = 0;

      for (const templateResult of templateResults) {
        if (!templateResult.success) {
          console.error(`IndividualEmailHandler: Template processing failed for user ${templateResult.user_id}:`, templateResult.error);
          emailResults.push({
            user_id: templateResult.user_id,
            success: false,
            error: `Template processing failed: ${templateResult.error}`
          });
          failureCount++;
          continue;
        }

        try {
          // Create individual email inputs for this user
          const individualEmailInputs: EmailServiceInputs = {
            ...data, // Copy all original fields
            to_address: [templateResult.email], // Single recipient
            subject: templateResult.processed_template.processed_primary_text || data.subject,
            body1: templateResult.processed_template.processed_secondary_text || data.body1,
            body2: templateResult.processed_template.processed_tertiary_text || data.body2,
            first: templateResult.processed_template.processed_primary_text?.split(' ')[1] || '', // Extract first name if available
            // Remove individual messaging flags for the actual email service call
            send_individual_messages: undefined,
            per_user_variables: undefined
          };

          // Send individual email
          const emailResult: EmailServiceResponse = await emailService.send(individualEmailInputs);

          if (emailResult.success) {
            emailResults.push({
              user_id: templateResult.user_id,
              success: true,
              emailId: emailResult.emailId
            });
            successCount++;
          } else {
            console.error(`IndividualEmailHandler: Email sending failed for user ${templateResult.user_id}:`, emailResult.error);
            emailResults.push({
              user_id: templateResult.user_id,
              success: false,
              error: emailResult.error || 'Email sending failed'
            });
            failureCount++;
          }

        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown email error';
          console.error(`IndividualEmailHandler: Unexpected error sending email to user ${templateResult.user_id}:`, emailError);
          emailResults.push({
            user_id: templateResult.user_id,
            success: false,
            error: errorMessage
          });
          failureCount++;
        }
      }

      // Step 6: Return results
      const metadata = {
        template: data.template_name,
        email_type: data.email_type,
        totalRecipients: templateResults.length,
        successCount,
        failureCount,
        processedAt: new Date().toISOString(),
        results: emailResults
      };

      const message = `Individual emails processed: ${successCount} sent, ${failureCount} failed out of ${templateResults.length} total`;
      
      console.log('IndividualEmailHandler: Individual email processing completed', metadata);

      if (successCount > 0) {
        return this.createSuccessResult(message, metadata);
      } else {
        return this.createFailureResult(
          'All individual emails failed to send',
          'No emails were sent successfully',
          metadata
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('IndividualEmailHandler: Unexpected error during individual email processing', error);
      
      // Create basic metadata for error case
      const errorMetadata = {
        template: data.template_name || 'unknown',
        email_type: data.email_type || 'unknown',
        totalRecipients: data.per_user_variables?.length || 0,
        successCount: 0,
        failureCount: data.per_user_variables?.length || 0,
        processedAt: new Date().toISOString(),
        results: []
      };
      
      return this.createFailureResult(
        'Individual email handler execution failed',
        errorMessage,
        errorMetadata
      );
    }
  }

  /**
   * Fetch user email addresses from user IDs using UserRepository
   */
  public async fetchUserEmails(userIds: string[]): Promise<string[]> {
    try {
      // Import UserRepository dynamically to avoid module-level issues
      const { userRepository } = await import('./repositories');
      
      // Get user emails from repository
      const userEmails = await userRepository.getUserEmails(userIds);

      if (userEmails.length === 0) {
        throw new Error('No user emails found');
      }

      // Map emails in the same order as userIds
      const emailMap = new Map(userEmails.map(user => [user.user_id, user.email]));
      const emails = userIds.map(userId => emailMap.get(userId)).filter(Boolean) as string[];

      return emails;
    } catch (error) {
      console.error('IndividualEmailHandler: Error in fetchUserEmails:', error);
      throw error;
    }
  }
}

/**
 * OrchestrationHandler - Handles orchestrated notifications through NotificationOrchestrator
 * 
 * Purpose: Route scheduled orchestration tasks to NotificationOrchestrator for coordinated push/email delivery
 * Expected Data: OrchestrationInputs object with mode, recipients, content, and scheduling info
 * Success: Returns success with workflowId and detailed push/email results from orchestrator
 * Failure: Returns error details from NotificationOrchestrator or validation failures
 */
export class OrchestrationHandler extends BaseTaskHandler {
  private notificationOrchestrator: any; // Use any to avoid import issues

  constructor(notificationOrchestrator?: any) {
    super('OrchestrationHandler');
    // Use provided orchestrator (for testing) or create a new one dynamically
    this.notificationOrchestrator = notificationOrchestrator;
  }

  private async getNotificationOrchestrator(): Promise<any> {
    if (!this.notificationOrchestrator) {
      // Dynamically import NotificationOrchestrator to avoid module-level instantiation
      const { NotificationOrchestrator } = await import('./notificationOrchestrator');
      this.notificationOrchestrator = new NotificationOrchestrator();
    }
    return this.notificationOrchestrator;
  }

  async execute(data: any): Promise<TaskExecutionResult> {
    try {
      // Validate that data is an OrchestrationInputs object
      if (!data || typeof data !== 'object') {
        return this.createFailureResult(
          'Invalid orchestration data: expected OrchestrationInputs object',
          'Data must be a valid OrchestrationInputs object'
        );
      }

      // Check for required fields
      const requiredFields = ['mode', 'send_date'];
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return this.createFailureResult(
          `Invalid orchestration data: missing required fields: ${missingFields.join(', ')}`,
          `Missing fields: ${missingFields.join(', ')}`
        );
      }

      // Validate mode
      if (!['push_preferred', 'both'].includes(data.mode)) {
        return this.createFailureResult(
          'Invalid orchestration data: mode must be "push_preferred" or "both"',
          `Invalid mode: ${data.mode}`
        );
      }

      // Ensure recipients are specified (either static, dynamic, or individual messaging)
      if (!data.users && !data.recipient_source && !data.send_individual_messages) {
        return this.createFailureResult(
          'Invalid orchestration data: must specify either users, recipient_source, or send_individual_messages',
          'No recipients specified'
        );
      }

      // For individual messaging, recipients come from per_user_variables instead of users/recipient_source
      if (data.send_individual_messages && (data.users || data.recipient_source)) {
        return this.createFailureResult(
          'Invalid orchestration data: cannot specify both individual messaging and traditional recipients',
          'Use either send_individual_messages with per_user_variables OR users/recipient_source, not both'
        );
      }

      // Ensure content is specified (either static or dynamic)
      if (!data.title && !data.content && !data.content_key && !data.content_source) {
        return this.createFailureResult(
          'Invalid orchestration data: must specify content (title/content, content_key, or content_source)',
          'No content specified'
        );
      }

      // Validate personalized messaging inputs if individual messaging is requested
      if (data.send_individual_messages) {
        if (!data.per_user_variables || !Array.isArray(data.per_user_variables) || data.per_user_variables.length === 0) {
          return this.createFailureResult(
            'Invalid orchestration data: per_user_variables array is required for individual messaging',
            'per_user_variables must be a non-empty array when send_individual_messages=true'
          );
        }

        // Validate per_user_variables structure
        for (let i = 0; i < data.per_user_variables.length; i++) {
          const userVar = data.per_user_variables[i];
          if (!userVar) {
            return this.createFailureResult(
              `Invalid orchestration data: per_user_variables[${i}] is undefined`,
              'All per_user_variables entries must be valid objects'
            );
          }
          if (!userVar.user_id || typeof userVar.user_id !== 'string') {
            return this.createFailureResult(
              `Invalid orchestration data: per_user_variables[${i}].user_id must be a non-empty string`,
              'Each user variable entry must have a valid user_id'
            );
          }
          if (!userVar.variables || typeof userVar.variables !== 'object') {
            return this.createFailureResult(
              `Invalid orchestration data: per_user_variables[${i}].variables must be an object`,
              'Each user variable entry must have a variables object'
            );
          }
        }

        // For individual messaging, we need email mode (can't do individual push notifications yet)
        if (data.mode === 'push_preferred') {
          return this.createFailureResult(
            'Invalid orchestration data: individual messaging currently only supports email mode (mode="both")',
            'Individual messaging requires email delivery'
          );
        }
      }

      console.log('OrchestrationHandler: Processing orchestration task', {
        mode: data.mode,
        hasStaticUsers: !!data.users,
        hasDynamicUsers: !!data.recipient_source,
        hasStaticContent: !!(data.title || data.content),
        hasDynamicContent: !!(data.content_key || data.content_source),
        individualMessaging: !!data.send_individual_messages,
        userVariableCount: data.per_user_variables?.length || 0,
        scheduledFor: data.send_date
      });

      // Route to IndividualEmailHandler if individual messaging is requested
      if (data.send_individual_messages) {
        return await this.handleIndividualMessaging(data);
      }

      // Get NotificationOrchestrator instance and send the orchestration
      const orchestrator = await this.getNotificationOrchestrator();
      const orchestrationInputs: OrchestrationInputs = data;
      const orchestrationResult: OrchestrationResponse = await orchestrator.send(orchestrationInputs);

      if (orchestrationResult.success) {
        const metadata = {
          workflowId: orchestrationResult.workflowId,
          mode: data.mode,
          pushResults: orchestrationResult.push_results,
          emailResults: orchestrationResult.email_results,
          processedAt: new Date().toISOString()
        };

        console.log('OrchestrationHandler: Orchestration completed successfully', metadata);

        return this.createSuccessResult(
          orchestrationResult.message,
          metadata
        );
      } else {
        console.error('OrchestrationHandler: Orchestration failed', {
          error: orchestrationResult.error,
          message: orchestrationResult.message,
          pushResults: orchestrationResult.push_results,
          emailResults: orchestrationResult.email_results
        });

        return this.createFailureResult(
          orchestrationResult.message,
          orchestrationResult.error || 'Unknown orchestration error'
        );
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OrchestrationHandler: Unexpected error during orchestration processing', error);
      
      return this.createFailureResult(
        'Orchestration handler execution failed',
        errorMessage
      );
    }
  }

  /**
   * Handle individual messaging by routing to IndividualEmailHandler
   * This method converts OrchestrationInputs to EmailServiceInputs format
   */
  private async handleIndividualMessaging(data: any): Promise<TaskExecutionResult> {
    try {
      console.log('OrchestrationHandler: Routing to individual email handler', {
        userCount: data.per_user_variables?.length,
        hasContentKey: !!data.content_key,
        hasStaticContent: !!(data.title || data.content)
      });

      // Convert OrchestrationInputs to EmailServiceInputs format
      const emailInputs = {
        // Required email fields
        template_name: data.content_key || 'orchestrated_message',
        email_type: 'notification',
        sender_fullname: data.sender_name || 'Gyld System',
        subject: data.title || data.subject || 'Notification',
        body1: data.content || data.body || 'You have a new notification',
        body2: data.body2 || '',
        send_date: data.send_date,
        
        // Recipient information (will be processed by IndividualEmailHandler)
        to_address: [], // Will be fetched by IndividualEmailHandler
        
        // Individual messaging flags
        send_individual_messages: true,
        per_user_variables: data.per_user_variables,
        
        // Template variables from orchestration data
        template_variables: {
          gathering_title: data.gathering_title,
          host_name: data.host_name,
          gathering_date: data.gathering_date,
          gathering_location: data.gathering_location,
          attendee_count: data.attendee_count,
          // Include any other orchestration-specific variables
          ...data.template_variables
        },
        
        // Copy other relevant fields
        gathering_title: data.gathering_title,
        host_name: data.host_name,
        gathering_date: data.gathering_date,
        gathering_location: data.gathering_location,
        attendee_count: data.attendee_count
      };

      // Get IndividualEmailHandler and execute
      const individualEmailHandler = TaskHandlerRegistry.get('individual_email');
      if (!individualEmailHandler) {
        return this.createFailureResult(
          'IndividualEmailHandler not available',
          'Individual email handler is not registered'
        );
      }

      const result = await individualEmailHandler.execute(emailInputs);
      
      // Add orchestration-specific metadata to the result
      if (result.metadata) {
        result.metadata = {
          ...result.metadata,
          orchestrationMode: data.mode,
          routedToIndividualHandler: true,
          originalOrchestrationData: {
            mode: data.mode,
            hasStaticUsers: !!data.users,
            hasDynamicUsers: !!data.recipient_source,
            content_key: data.content_key
          }
        };
      }

      console.log('OrchestrationHandler: Individual messaging completed', {
        success: result.success,
        message: result.message,
        userCount: data.per_user_variables?.length
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OrchestrationHandler: Error in individual messaging routing', error);
      
      return this.createFailureResult(
        'Individual messaging routing failed',
        errorMessage
      );
    }
  }
}

// Auto-register handlers
TaskHandlerRegistry.register('orchestration', new OrchestrationHandler());
TaskHandlerRegistry.register('email', new EmailHandler());
TaskHandlerRegistry.register('individual_email', new IndividualEmailHandler());
TaskHandlerRegistry.register('custom', new LogMessageHandler());