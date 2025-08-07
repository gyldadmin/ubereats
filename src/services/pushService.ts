import type { 
  PushServiceInputs, 
  PushServiceResponse, 
  PushTokenInfo
} from '../types/push';
import { getProcessedContentTemplate } from './contentTemplateService';
import { supabase } from './supabase';

interface StatusOptionLookup {
  id: string;
  label: string;
}

interface WorkflowTypeLookup {
  id: string;
  label: string;
}

export class PushService {

  constructor() {
    // No expo client needed - we'll call Edge Functions instead
  }

  /**
   * Main entry point for sending push notifications immediately
   * All scheduling should now be handled by the central scheduler
   */
  public async send(inputs: PushServiceInputs): Promise<PushServiceResponse> {
    try {
      console.log('PushService: Processing immediate push request', { 
        users: inputs.users, 
        title: inputs.title1
      });

      // Validate inputs
      this.validateInputs(inputs);

        // Send immediately
        return await this.sendImmediately(inputs);
    } catch (error) {
      console.error('PushService: Error processing push request', error);
      return {
        success: false,
        message: 'Failed to process push request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send push notification immediately via Edge Function
   */
  private async sendImmediately(inputs: PushServiceInputs): Promise<PushServiceResponse> {
    console.log('PushService: Sending push immediately');

    try {
      // Process content template if provided
      let processedContent = {
        title1: inputs.title1,
        title2: inputs.title2,
        content: inputs.content
      };

      if (inputs.content_key && inputs.template_variables) {
        console.log('PushService: Processing content template', { 
          contentKey: inputs.content_key 
        });

        const template = await getProcessedContentTemplate(
          inputs.content_key,
          'push',
          inputs.template_variables
        );

        if (template) {
          processedContent = {
            title1: template.processed_primary_text || inputs.title1,
            title2: template.processed_secondary_text || inputs.title2,
            content: template.processed_tertiary_text || inputs.content
          };
        }
      }

      // Get push tokens for enabled users
      const userTokens = await this.getUserPushTokens(inputs.users);
      console.log('PushService: Retrieved push tokens', { 
        totalUsers: inputs.users.length,
        tokensFound: userTokens.length 
      });

      if (userTokens.length === 0) {
        return {
          success: false,
          message: 'No users have push notifications enabled or valid tokens',
          failedUsers: inputs.users
        };
      }

      // Call Edge Function to send push notifications
      const pushPayload = {
        tokens: userTokens.map(ut => ut.push_token).filter(Boolean),
        title: processedContent.title1,
        subtitle: processedContent.title2,
        body: processedContent.content,
        data: {
          deep_link: inputs.deep_link,
          buttons: this.buildActionButtons(inputs),
          initiated_by: inputs.initiated_by,
          gathering_id: inputs.gathering_ID,
          candidate_id: inputs.candidate_ID
        },
        // Add rich content with image if provided
        ...(inputs.image_url && {
          richContent: {
            image: inputs.image_url
          }
        })
      };

      const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('send-push-notification', {
        body: pushPayload
      });

      if (edgeError) {
        throw new Error(`Edge function error: ${edgeError.message}`);
      }

      // Process results from Edge Function
      const successful = edgeResult.successful || [];
      const failed = edgeResult.failed || [];
      const failedUsers = userTokens
        .filter(ut => failed.some((ft: any) => ft.token === ut.push_token))
        .map(ut => ut.user_id);

      // Record notifications sent
      await this.recordNotificationsSent(inputs, processedContent, userTokens, {
        successful,
        failed
      });

      return {
        success: successful.length > 0,
        message: `Push sent to ${successful.length}/${userTokens.length} users`,
        ticketIds: edgeResult.ticketIds || [],
        failedUsers: failedUsers
      };
    } catch (error) {
      console.error('PushService: Error sending immediate push', error);
      
      // Record failed notification
      await this.recordFailedNotification(inputs, error);

      return {
        success: false,
        message: 'Failed to send push notification',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedUsers: inputs.users
      };
    }
  }







  /**
   * Get push tokens for users who have push notifications enabled
   */
  private async getUserPushTokens(userIds: string[]): Promise<PushTokenInfo[]> {
    console.log('PushService: Fetching push tokens', { userCount: userIds.length });

    const { data, error } = await supabase
      .from('users_private')
      .select('user_id, push_token, push_enabled')
      .in('user_id', userIds)
      .eq('push_enabled', true)
      .not('push_token', 'is', null);

    if (error) {
      console.error('PushService: Error fetching push tokens', error);
      return [];
    }

    const validTokens = (data || [])
      .filter(user => user.push_token && this.isExpoPushToken(user.push_token))
      .map(user => ({
        user_id: user.user_id,
        push_token: user.push_token,
        push_enabled: user.push_enabled,
        updated_at: new Date()
      }));

    console.log('PushService: Valid push tokens found', { 
      total: data?.length || 0,
      valid: validTokens.length 
    });

    return validTokens;
  }

  /**
   * Check if token is a valid Expo push token format
   */
  private isExpoPushToken(token: string): boolean {
    // Basic validation for Expo push token format
    return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
  }

  /**
   * Build action buttons array from inputs
   */
  private buildActionButtons(inputs: PushServiceInputs): Array<{text: string, url: string}> {
    const buttons: Array<{text: string, url: string}> = [];
    
    if (inputs.button1_text && inputs.button1_url) {
      buttons.push({ text: inputs.button1_text, url: inputs.button1_url });
    }
    if (inputs.button2_text && inputs.button2_url) {
      buttons.push({ text: inputs.button2_text, url: inputs.button2_url });
    }
    if (inputs.button3_text && inputs.button3_url) {
      buttons.push({ text: inputs.button3_text, url: inputs.button3_url });
    }
    
    return buttons;
  }

  /**
   * Record successful notifications in database
   */
  private async recordNotificationsSent(
    inputs: PushServiceInputs,
    content: { title1: string, title2?: string, content: string },
    userTokens: PushTokenInfo[],
    results: { successful: any[], failed: Array<{token: string, error: string}> }
  ): Promise<void> {
    try {
      // Get push workflow type
      const pushWorkflowType = await this.lookupWorkflowType('push');

      // Record successful sends
      if (results.successful.length > 0) {
        const successfulUserIds = results.successful.map((successToken: any) => {
          return userTokens.find(ut => ut.push_token === successToken)?.user_id;
        }).filter(Boolean) as string[];

        await supabase
          .from('notifications_sent')
          .insert({
            workflow_type: pushWorkflowType.id,
            to_address: successfulUserIds,
            body1: content.content,
            subject: content.title1,
            send_date: new Date(),
            status: 'sent'
          });

        console.log('PushService: Recorded successful push notifications', { 
          count: successfulUserIds.length 
        });
      }

      // Record failed sends
      if (results.failed.length > 0) {
        const failedUserIds = results.failed.map(fail => {
          return userTokens.find(ut => ut.push_token === fail.token)?.user_id;
        }).filter(Boolean) as string[];

        if (failedUserIds.length > 0) {
          await supabase
            .from('notifications_sent')
            .insert({
              workflow_type: pushWorkflowType.id,
              to_address: failedUserIds,
              body1: content.content,
              subject: content.title1,
              send_date: new Date(),
              status: 'failed'
            });

          console.log('PushService: Recorded failed push notifications', { 
            count: failedUserIds.length 
          });
        }
      }
    } catch (error) {
      console.error('PushService: Failed to record notifications sent', error);
      // Don't throw here - we don't want to fail the push send because of logging issues
    }
  }

  /**
   * Record failed notification when entire push operation fails
   */
  private async recordFailedNotification(inputs: PushServiceInputs, error: any): Promise<void> {
    try {
      const pushWorkflowType = await this.lookupWorkflowType('push');

      await supabase
        .from('notifications_sent')
        .insert({
          workflow_type: pushWorkflowType.id,
          to_address: inputs.users,
          body1: inputs.content,
          subject: inputs.title1,
          send_date: new Date(),
          status: 'failed'
        });

      console.log('PushService: Recorded failed push notification for all users');
    } catch (recordError) {
      console.error('PushService: Failed to record failed notification', recordError);
    }
  }

  /**
   * Lookup helper methods
   */
  private async lookupStatusOption(label: string): Promise<StatusOptionLookup> {
    const { data, error } = await supabase
      .from('status_options')
      .select('id, label')
      .eq('label', label)
      .single();

    if (error || !data) {
      throw new Error(`Status option '${label}' not found: ${error?.message}`);
    }

    return data as StatusOptionLookup;
  }

  private async lookupWorkflowType(label: string): Promise<WorkflowTypeLookup> {
    const { data, error } = await supabase
      .from('workflow_type')
      .select('id, label')
      .eq('label', label)
      .single();

    if (error || !data) {
      throw new Error(`Workflow type '${label}' not found: ${error?.message}`);
    }

    return data as WorkflowTypeLookup;
  }



  private validateInputs(inputs: PushServiceInputs): void {
    // Required field validation
    if (!inputs.title1) throw new Error('title1 is required');
    if (!inputs.content) throw new Error('content is required');
    if (!inputs.users || inputs.users.length === 0) throw new Error('users is required and must not be empty');
    if (!inputs.send_date) throw new Error('send_date is required');
    if (!inputs.initiated_by) throw new Error('initiated_by is required');
  }
} 