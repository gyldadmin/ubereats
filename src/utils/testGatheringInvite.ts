import { supabase } from '../services/supabase';
import { NotificationOrchestrator } from '../services/notificationOrchestrator';
import { getPushNotificationLogo, shouldIncludePushLogo } from '../constants/branding';
import type { OrchestrationInputs } from '../types/orchestration';

/**
 * Standalone test function for gathering invitation with content templates
 * Can be called from anywhere in the app for testing
 */
export async function testGatheringInviteWithTemplates(userGyld: string, userId: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
  gatheringTitle?: string;
  recipientCount?: number;
  pushResults?: any;
  emailResults?: any;
}> {
  try {
    console.log('testGatheringInviteWithTemplates: Starting test...');

    if (!userGyld) {
      return {
        success: false,
        message: 'No gyld found for current user',
        error: 'MISSING_GYLD'
      };
    }

    // Find most recent launched gathering
    const { data: launchedStatusData, error: statusError } = await supabase
      .from('gathering_status')
      .select('id')
      .eq('label', 'launched')
      .single();

    if (statusError) {
      return {
        success: false,
        message: 'Error finding launched status in database',
        error: statusError.message
      };
    }

    const { data: gatheringData, error: gatheringError } = await supabase
      .from('gatherings')
      .select(`
        id,
        title,
        host,
        experience_type,
        date_time,
        location,
        current_participants,
        updated_at
      `)
      .eq('gathering_status', launchedStatusData.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (gatheringError || !gatheringData || gatheringData.length === 0) {
      return {
        success: false,
        message: 'No launched gatherings found in database',
        error: gatheringError?.message || 'NO_GATHERINGS'
      };
    }

    const gathering = gatheringData[0];

    // Get all users in the same gyld as recipients
    const { data: gyldUsers, error: usersError } = await supabase
      .from('users_public')
      .select('user_id, first_name, full_name')
      .eq('gyld', userGyld);

    if (usersError || !gyldUsers || gyldUsers.length === 0) {
      return {
        success: false,
        message: 'No gyld members found',
        error: usersError?.message || 'NO_MEMBERS'
      };
    }

    const recipientUserIds = gyldUsers.map(u => u.user_id);

    // Format gathering date
    const gatheringDate = gathering.date_time ? 
      new Date(gathering.date_time).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }) : 'TBD';

    // Create template variables mapping
    const templateVariables = {
      gathering_title: gathering.title || 'Untitled Event',
      host_name: gathering.host?.[0] ? 'Host' : 'Unknown Host',
      experience_type: 'Event',
      gathering_date: gatheringDate,
      gathering_location: gathering.location || 'TBD',
      first_name: 'Member',
      attendee_count: gathering.current_participants || 0
    };

    // Create orchestration inputs using content templates
    const testInviteInputs: OrchestrationInputs = {
      mode: 'push_preferred',
      users: recipientUserIds,
      send_date: new Date(),
      
      // Use content templates
      content_key: 'test_invite',
      template_variables: templateVariables,
      
      // Deep linking and buttons
      deep_link: `GatheringDetailScreen?id=${gathering.id}`,
      button1_text: 'View Details',
      button1_url: `GatheringDetailScreen?id=${gathering.id}`,
      button2_text: 'RSVP',
      button2_url: `RSVPScreen?gathering=${gathering.id}`,
      
      // Email configuration
      email_template_name: 'invite_with_envelope',
      email_type: 'invitation',
      sender_fullname: 'Gyld',
      
      // Metadata
      initiated_by: userId,
      gathering_ID: gathering.id
    };

    // Call orchestrator
    const notificationOrchestrator = new NotificationOrchestrator();
    const result = await notificationOrchestrator.send(testInviteInputs);
    
    return {
      success: result.success,
      message: result.message,
      error: result.error,
      gatheringTitle: gathering.title,
      recipientCount: recipientUserIds.length,
      pushResults: result.push_results,
      emailResults: result.email_results
    };

  } catch (error) {
    console.error('testGatheringInviteWithTemplates: Error', error);
    return {
      success: false,
      message: 'Test function error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Quick test function that can be called with minimal parameters
 */
export async function quickTestGatheringInvite(): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return;
    }

    // Get user's gyld
    const { data: userPublic } = await supabase
      .from('users_public')
      .select('gyld')
      .eq('user_id', user.id)
      .single();

    if (!userPublic?.gyld) {
      console.error('No gyld found for user');
      return;
    }

    // Run test
    const result = await testGatheringInviteWithTemplates(userPublic.gyld, user.id);
    
    console.log('Quick test result:', result);
    
    if (result.success) {
      console.log(`✅ Test successful! Sent to ${result.recipientCount} members for "${result.gatheringTitle}"`);
    } else {
      console.error(`❌ Test failed: ${result.message}`);
    }

  } catch (error) {
    console.error('quickTestGatheringInvite error:', error);
  }
} 