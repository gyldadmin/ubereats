import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { GatheringCardCompactV1 } from '../components/ui';
import { useHomeGatherings } from '../hooks/useHomeGatherings';
import type { GatheringCardData } from '../hooks/useHomeGatherings';
import { 
  Input, 
  TextArea, 
  MultiSelect, 
  SegmentedInput, 
  ChipSelection, 
  Checkbox, 
  Toggle,
  NativeDateTimePicker,
  PaperDropdown,
  SearchableDropdown,
  EventDateTimePicker 
} from '../components/inputs';
import { ImageUpload } from '../components/ui';
import { supabase } from '../services/supabase';
import { emailService } from '../services/emailService';
import { PushService } from '../services/pushService';
import { NotificationOrchestrator } from '../services/notificationOrchestrator';
import { pushTokenService } from '../services/pushTokenService';
import type { EmailServiceInputs } from '../types/email';
import type { PushServiceInputs } from '../types/push';
import type { OrchestrationInputs } from '../types/orchestration';

// Constants for expandable list behavior
const INITIAL_VISIBLE_COUNT = 3;

// Initialize services
const pushService = new PushService();
const notificationOrchestrator = new NotificationOrchestrator();

export default function HomeScreen() {
  const navigation = useNavigation();
  const { gatherings, loading, error, refresh, updateRSVP } = useHomeGatherings();
  
  // State for show more/less functionality
  const [isExpanded, setIsExpanded] = useState(false);

  // Refresh data when screen comes into focus (e.g., returning from detail screen)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Helper function to get visible gatherings based on expansion state
  const getVisibleGatherings = () => {
    if (isExpanded || gatherings.length <= INITIAL_VISIBLE_COUNT) {
      return gatherings;
    }
    return gatherings.slice(0, INITIAL_VISIBLE_COUNT);
  };

  // Helper function to determine if toggle button should be shown
  const shouldShowToggle = () => {
    return gatherings.length > INITIAL_VISIBLE_COUNT;
  };

  // Handle toggle expansion
  const handleToggleExpansion = () => {
    console.log(`📝 Toggling gathering list: ${isExpanded ? 'collapsing' : 'expanding'}`);
    setIsExpanded(!isExpanded);
  };

  // Handle card press navigation based on user role
  const handleGatheringPress = (gatheringData: GatheringCardData) => {
    // Check if user is host of this gathering
    if (gatheringData.userRole.isHost) {
      // Navigate to GatheringManage for hosts
      (navigation as any).navigate('GatheringManage', { gatheringId: gatheringData.gathering.id });
    } else {
      // Navigate to EventDetailScreen for non-hosts
      (navigation as any).navigate('EventDetail', { 
        gatheringData: gatheringData 
      });
    }
  };

  // Function to load the most recent gathering for testing
  const handleSetupWithRecentGathering = async () => {
    try {
      console.log('🔍 Fetching most recent gathering...');
      
      // Query the most recent gathering
      const { data: recentGathering, error } = await supabase
        .from('gatherings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Error fetching recent gathering:', error);
        return;
      }

      if (!recentGathering) {
        console.log('⚠️ No gatherings found');
        return;
      }

      console.log('✅ Found recent gathering:', recentGathering.id);
      
      // Navigate to GatheringSetup with the gathering data
      (navigation as any).navigate('GatheringSetup', { 
        gatheringId: recentGathering.id // Pass the gathering ID to load existing gathering
      });
    } catch (error) {
      console.error('❌ Error in handleSetupWithRecentGathering:', error);
    }
  };

  // Handle RSVP button press (for non-hosts and non-scribes)
  const handleRSVPPress = (gatheringId: string, currentStatus: string) => {
    // Find the gathering data
    const gatheringData = gatherings.find(g => g.gathering.id === gatheringId);
    if (!gatheringData) {
      return;
    }
    
    // If user is host or scribe, treat like card press
    if (gatheringData.userRole.isHost || gatheringData.userRole.isScribe) {
      handleGatheringPress(gatheringData);
      return;
    }
    
    // For regular users, handle RSVP logic
    if (currentStatus === 'pending') {
      // Show RSVP options dropdown (existing behavior)
      return;
    }
    
    // Toggle RSVP status
    const newStatus = currentStatus === 'yes' ? 'no' : 'yes';
    updateRSVP(gatheringId, newStatus);
  };

  // Handle RSVP selection from dropdown
  const handleRSVPSelect = (gatheringId: string, status: 'yes' | 'no') => {
    updateRSVP(gatheringId, status);
  };

  // Handle plan gathering navigation
  const handlePlanGathering = () => {
    navigation.navigate('Roles' as never);
  };

  // Handle test email send
  const handleTestEmail = async () => {
    try {
      console.log('HomeScreen: Sending test email...');
      
      // Create test email inputs as requested
      const testEmailInputs: EmailServiceInputs = {
        template_name: 'basic_with_button',
        email_type: 'invite', 
        sender_fullname: 'Gyld Test System',
        subject: 'Test Email from Gyld App',
        body1: 'This is a test email sent from the Gyld mobile app to verify the email service is working correctly.',
        to_address: ['wtriant@gmail.com'],
        send_date: new Date(), // Send immediately
        initiated_by: 'test-user-id', // Placeholder user ID
        buttontext: 'View in App',
        buttonurl: 'https://app.gyld.org/test',
        unsubscribeurl: 'https://app.gyld.org/unsubscribe',
        reply_to_address: 'noreply@gyld.org'
      };

      // Call email service
      const result = await emailService.send(testEmailInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test email sent successfully', result);
        alert(`✅ Test email sent successfully!\n\nMessage: ${result.message}\nEmail ID: ${result.emailId || 'N/A'}`);
      } else {
        console.error('HomeScreen: Test email failed', result);
        alert(`❌ Test email failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error sending test email', error);
      alert(`❌ Test email error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle test invite email with envelope template
  const handleTestInviteEmail = async () => {
    try {
      console.log('HomeScreen: Sending test invite email with envelope template...');
      
      // Create test email inputs for invite_with_envelope template
      const testInviteInputs: EmailServiceInputs = {
        template_name: 'invite_with_envelope',
        email_type: 'invite',
        sender_fullname: 'Gyld Events Team',
        first: 'Sarah',
        gath_date: 'Thursday, January 25th at 7:00 PM',
        gath_title: 'Monthly Networking Happy Hour',
        subject: "You're invited: Monthly Networking Happy Hour",
        body1: 'Join us for an evening of networking and conversation with fellow professionals in your area.',
        body2: 'Light appetizers and drinks will be provided. Business casual attire recommended.',
        to_address: ['wtriant@gmail.com'],
        send_date: new Date(), // Send immediately
        initiated_by: 'test-user-id', // Placeholder user ID
        buttontext: 'RSVP Now',
        buttonurl: 'https://app.gyld.org/gathering/123/rsvp',
        unsubscribeurl: 'https://app.gyld.org/unsubscribe',
        reply_to_address: 'events@gyld.org',
        header_image: 'https://app.gyld.org/images/happy-hour-header.png'
      };

      // Call email service
      const result = await emailService.send(testInviteInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test invite email sent successfully', result);
        alert(`✅ Test invite email sent successfully!\n\nMessage: ${result.message}\nEmail ID: ${result.emailId || 'N/A'}`);
      } else {
        console.error('HomeScreen: Test invite email failed', result);
        alert(`❌ Test invite email failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error sending test invite email', error);
      alert(`❌ Test invite email error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle test scheduled email with workflow_data
  const handleTestScheduledEmail = async () => {
    try {
      console.log('HomeScreen: Scheduling test email with workflow_data...');
      
      // Create test email inputs for scheduled email (2 minutes from now)
      const sendDate = new Date();
      sendDate.setMinutes(sendDate.getMinutes() + 2); // Schedule 2 minutes from now
      
      const testScheduledInputs: EmailServiceInputs = {
        template_name: 'basic_with_button',
        email_type: 'test',
        sender_fullname: 'Gyld Scheduled Email Test',
        subject: 'Test Scheduled Email with Workflow Data',
        body1: `This scheduled email was sent using the new workflow_data system. It was scheduled at ${new Date().toLocaleTimeString()} and should arrive at ${sendDate.toLocaleTimeString()}.`,
        body2: 'The email inputs were stored in the planned_workflows.workflow_data JSONB field and retrieved at send time.',
        to_address: ['wtriant@gmail.com'],
        send_date: sendDate,
        initiated_by: 'test-user-id',
        buttontext: 'View Workflow Data',
        buttonurl: 'https://app.gyld.org/admin/workflows',
        unsubscribeurl: 'https://app.gyld.org/unsubscribe',
        reply_to_address: 'noreply@gyld.org'
      };

      // Call email service (will schedule since send_date is in future)
      const result = await emailService.send(testScheduledInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test scheduled email created successfully', result);
        alert(`✅ Test scheduled email created!\n\nScheduled for: ${sendDate.toLocaleTimeString()}\nWorkflow ID: ${result.workflowId || 'N/A'}\n\nCheck your email in 2 minutes!`);
      } else {
        console.error('HomeScreen: Test scheduled email failed', result);
        alert(`❌ Test scheduled email failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error scheduling test email', error);
      alert(`❌ Test scheduled email error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle processing pending workflows
  const handleProcessPendingWorkflows = async () => {
    try {
      console.log('HomeScreen: Processing pending workflows...');
      
      // Process any pending email workflows from database
      await emailService.processPendingWorkflows();
      
      alert(`✅ Pending workflows processed!\n\nCheck console for details about any workflows found and processed.`);
      
    } catch (error) {
      console.error('HomeScreen: Error processing pending workflows', error);
      alert(`❌ Error processing pending workflows!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle test push notification
  const handleTestPush = async () => {
    try {
      console.log('HomeScreen: Sending test push notification...');
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'test-user-id';
      
      // Create test push inputs (immediate send for testing)
      const sendDate = new Date();
      
      const testPushInputs: PushServiceInputs = {
        title1: 'Test Push from Gyld',
        title2: 'Push Service Test',
        content: 'This is a test push notification sent from the Gyld mobile app to verify the push service is working correctly.',
        users: [userId], // Use real user ID
        send_date: sendDate,
        deep_link: 'HomeScreen?tab=notifications',
        button1_text: 'View App',
        button1_url: 'HomeScreen',
        button2_text: 'Settings',
        button2_url: 'YouScreen?section=notifications',
        initiated_by: userId
      };

      // Call push service
      const result = await pushService.send(testPushInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test push sent successfully', result);
        alert(`✅ Test push sent successfully!\n\nMessage: ${result.message}\nTicket IDs: ${result.ticketIds?.length || 0}\n\nNote: Push will only send if user has valid token and enabled push.`);
      } else {
        console.error('HomeScreen: Test push failed', result);
        alert(`❌ Test push failed!\n\nError: ${result.error || result.message}\n\nFailed users: ${result.failedUsers?.join(', ') || 'N/A'}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error sending test push', error);
      alert(`❌ Test push error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle test orchestration (push_preferred mode)
  const handleTestOrchestrationPushPreferred = async () => {
    try {
      console.log('HomeScreen: Testing orchestration with push_preferred mode...');
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'test-user-id';
      
      const testOrchestrationInputs: OrchestrationInputs = {
        mode: 'push_preferred',
        users: [userId], // Use real user ID
        send_date: new Date(), // Send immediately
        title: 'Test Orchestration Notification',
        subtitle: 'Push Preferred Mode',
        content: 'This is a test notification using the orchestration service in push_preferred mode. It tries push first, then falls back to email.',
        secondary_content: 'This email fallback was triggered because the user doesn\'t have push notifications enabled or a valid push token.',
        deep_link: 'HomeScreen?section=orchestration',
        button1_text: 'View Details',
        button1_url: 'HomeScreen',
        initiated_by: userId,
        email_template_name: 'basic_with_button',
        sender_fullname: 'Gyld Orchestration Test'
      };

      // Call orchestrator
      const result = await notificationOrchestrator.send(testOrchestrationInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test orchestration completed successfully', result);
        
        const pushInfo = result.push_results?.attempted ? 
          `Push: ${result.push_results.success ? `✅ ${result.push_results.sent_count} sent` : `❌ ${result.push_results.failed_count} failed`}` : 
          'Push: Not attempted';
          
        const emailInfo = result.email_results?.attempted ? 
          `Email: ${result.email_results.success ? `✅ ${result.email_results.sent_count} sent` : `❌ ${result.email_results.failed_count} failed`}` : 
          'Email: Not attempted';
          
        alert(`✅ Orchestration completed!\n\n${pushInfo}\n${emailInfo}\n\nMessage: ${result.message}`);
      } else {
        console.error('HomeScreen: Test orchestration failed', result);
        alert(`❌ Orchestration failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error in test orchestration', error);
      alert(`❌ Orchestration error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle test orchestration (both mode)
  const handleTestOrchestrationBoth = async () => {
    try {
      console.log('HomeScreen: Testing orchestration with both mode...');
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'test-user-id';
      
      const testOrchestrationInputs: OrchestrationInputs = {
        mode: 'both',
        users: [userId], // Use real user ID
        send_date: new Date(), // Send immediately
        title: 'Test Both Mode Notification',
        subtitle: 'Push + Email',
        content: 'This is a test notification using the orchestration service in both mode. It sends both push and email notifications.',
        secondary_content: 'You should receive both a push notification (if enabled) and an email for this test.',
        deep_link: 'HomeScreen?section=both_test',
        button1_text: 'Open App',
        button1_url: 'HomeScreen',
        button2_text: 'Settings',
        button2_url: 'YouScreen',
        initiated_by: userId,
        email_template_name: 'basic_with_button',
        sender_fullname: 'Gyld Both Mode Test'
      };

      // Call orchestrator
      const result = await notificationOrchestrator.send(testOrchestrationInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test both mode orchestration completed successfully', result);
        
        const pushInfo = result.push_results?.attempted ? 
          `Push: ${result.push_results.success ? `✅ ${result.push_results.sent_count} sent` : `❌ ${result.push_results.failed_count} failed`}` : 
          'Push: Not attempted';
          
        const emailInfo = result.email_results?.attempted ? 
          `Email: ${result.email_results.success ? `✅ ${result.email_results.sent_count} sent` : `❌ ${result.email_results.failed_count} failed`}` : 
          'Email: Not attempted';
          
        alert(`✅ Both mode orchestration completed!\n\n${pushInfo}\n${emailInfo}\n\nMessage: ${result.message}`);
      } else {
        console.error('HomeScreen: Test both mode orchestration failed', result);
        alert(`❌ Both mode orchestration failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error in test both mode orchestration', error);
      alert(`❌ Both mode orchestration error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle processing pending push workflows
  const handleProcessPendingPushWorkflows = async () => {
    try {
      console.log('HomeScreen: Processing pending push workflows...');
      
      // Process any pending push workflows from database
      await pushService.processPendingWorkflows();
      
      alert(`✅ Pending push workflows processed!\n\nCheck console for details about any workflows found and processed.`);
      
    } catch (error) {
      console.error('HomeScreen: Error processing pending push workflows', error);
      alert(`❌ Error processing pending push workflows!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle push token registration
  const handleRegisterPushToken = async () => {
    try {
      console.log('HomeScreen: Registering for push notifications...');
      
      // Request permissions and get push token
      const result = await pushTokenService.requestPermissionAndGetToken();
      
      if (result.success) {
        console.log('HomeScreen: Push token registration successful', result);
        alert(`✅ Push notifications enabled!\n\nMessage: ${result.message}\nToken: ${result.token ? result.token.substring(0, 20) + '...' : 'N/A'}`);
      } else {
        console.error('HomeScreen: Push token registration failed', result);
        alert(`❌ Push registration failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error registering push token', error);
      alert(`❌ Push registration error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle checking push permission status
  const handleCheckPushStatus = async () => {
    try {
      console.log('HomeScreen: Checking push notification status...');
      
      // Check current permission status
      const permissionStatus = await pushTokenService.checkPermissionStatus();
      
      // Get current token from database
      const currentToken = await pushTokenService.getCurrentToken();
      
      const statusText = permissionStatus.granted ? '✅ Granted' : 
                        permissionStatus.canAskAgain ? '⚠️ Not determined' : '❌ Denied';
      
      alert(`Push Notification Status:\n\nPermission: ${statusText}\nCan ask again: ${permissionStatus.canAskAgain ? 'Yes' : 'No'}\nHave token: ${currentToken ? 'Yes' : 'No'}\n\nToken: ${currentToken ? currentToken.substring(0, 20) + '...' : 'None'}`);
      
    } catch (error) {
      console.error('HomeScreen: Error checking push status', error);
      alert(`❌ Error checking push status!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Transform data for the existing card component
  const transformGatheringData = (cardData: GatheringCardData) => {
    const { gathering, gatheringDisplay, userRole, displayImage, formattedDate, experienceTypeLabel, hostNames, mentorInfo } = cardData;



    return {
      id: gathering.id,
      title: gathering.title || 'Untitled Gathering',
      start_time: gathering.start_time || '',
      end_time: gathering.end_time || '',
      experience_type: experienceTypeLabel,
      address: gatheringDisplay?.address || 'Location TBD',
      image: displayImage,
      description: gatheringDisplay?.description || 'No description available',
      host_names: hostNames,
      mentor_name: mentorInfo?.mentor_satellite?.full_name,
      mentor_company: mentorInfo?.employer_info?.name,
      participant_count: 0, // TODO: Calculate from participation_gatherings
      max_participants: cardData.gatheringOther?.cap || 0,
      rsvp_status: userRole.rsvpStatus,
      userRole: userRole,
    };
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading gatherings...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading gatherings</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Upcoming Gatherings
          </Text>
        </View>

        <View style={styles.section}>
          {gatherings.length === 0 ? (
            // No gatherings state
            <View style={styles.noGatheringsContainer}>
              <Text style={styles.noGatheringsTitle}>No gatherings on the calendar</Text>
              <Text style={styles.noGatheringsSubtitle}>
                Please come back soon or{' '}
                <TouchableOpacity onPress={handlePlanGathering}>
                  <Text style={styles.planLink}>plan one</Text>
                </TouchableOpacity>
              </Text>
            </View>
          ) : (
            <>
              {/* Gatherings list with expandable functionality */}
              {getVisibleGatherings().map((gatheringData) => (
                <GatheringCardCompactV1
                  key={gatheringData.gathering.id}
                  gathering={transformGatheringData(gatheringData)}
                  onPress={() => handleGatheringPress(gatheringData)}
                  onRSVPPress={() => handleRSVPPress(
                    gatheringData.gathering.id,
                    gatheringData.userRole.rsvpStatus
                  )}
                  onRSVPSelect={(status) => handleRSVPSelect(gatheringData.gathering.id, status)}
                />
              ))}

              {/* Show More/Show Less toggle button */}
              {shouldShowToggle() && (
                <TouchableOpacity 
                  style={styles.toggleButton} 
                  onPress={handleToggleExpansion}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleButtonText}>
                    {isExpanded ? 'Show Fewer' : 'Show More'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* TEMPORARY: Host Screens Testing Section */}
        <View style={styles.tempTestingSection}>
          <Text style={styles.tempTestingTitle}>🚧 TEMP: Host Screens Testing</Text>
          <View style={styles.tempButtonGrid}>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringSetup', { mentoring: true })}
            >
              <Text style={styles.tempButtonText}>Setup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringSetup', { mentoring: false })}
            >
              <Text style={styles.tempButtonText}>Setup (Other)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleSetupWithRecentGathering}
            >
              <Text style={styles.tempButtonText}>Setup (Recent)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringManage')}
            >
              <Text style={styles.tempButtonText}>Manage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringPromote')}
            >
              <Text style={styles.tempButtonText}>Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('GatheringResources')}
            >
              <Text style={styles.tempButtonText}>Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('MentoringCalendar')}
            >
              <Text style={styles.tempButtonText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={() => (navigation as any).navigate('MentorFinder')}
            >
              <Text style={styles.tempButtonText}>Find Mentor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestEmail}
            >
              <Text style={styles.tempButtonText}>Test Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestInviteEmail}
            >
              <Text style={styles.tempButtonText}>Test Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestScheduledEmail}
            >
              <Text style={styles.tempButtonText}>Test Scheduled</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleProcessPendingWorkflows}
            >
              <Text style={styles.tempButtonText}>Process Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestPush}
            >
              <Text style={styles.tempButtonText}>Test Push</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestOrchestrationPushPreferred}
            >
              <Text style={styles.tempButtonText}>Test Push Preferred</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestOrchestrationBoth}
            >
              <Text style={styles.tempButtonText}>Test Both Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleProcessPendingPushWorkflows}
            >
              <Text style={styles.tempButtonText}>Process Push Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleRegisterPushToken}
            >
              <Text style={styles.tempButtonText}>Register Push Token</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleCheckPushStatus}
            >
              <Text style={styles.tempButtonText}>Check Push Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TEMPORARY: Input Components Testing Section */}
        <InputTestingSection />

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

// TEMPORARY: Input Components Testing Section
const InputTestingSection = () => {
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [nativeDateValue, setNativeDateValue] = useState<Date>(new Date());

  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
  const [segmentedValue, setSegmentedValue] = useState<string>('');
  const [chipSelectionValue, setChipSelectionValue] = useState<string[]>([]);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);

  // Native dropdown state
  const [paperDropdownValue, setPaperDropdownValue] = useState<string>('');
  
  // Searchable dropdown state
  const [searchableDropdownValue, setSearchableDropdownValue] = useState<string>('');

  // Event date time picker state
  const createDefaultStartTime = () => {
    const now = new Date();
    now.setHours(18, 0, 0, 0); // 6 PM today
    return now;
  };
  
  const createDefaultEndTime = () => {
    const start = createDefaultStartTime();
    const end = new Date(start);
    end.setHours(start.getHours() + 1, start.getMinutes() + 30, 0, 0); // Add 1.5 hours
    return end;
  };

  const [eventStartTime, setEventStartTime] = useState<Date>(createDefaultStartTime());
  const [eventEndTime, setEventEndTime] = useState<Date>(createDefaultEndTime());
  const [imageValue, setImageValue] = useState<string | null>(null);

  // Remove these dropdown picker state variables:
  // const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [dropdownItems, setDropdownItems] = useState([...]);

  // Remove the searchableDropdownOptions array:
  // const searchableDropdownOptions = [...];

  const multiSelectOptions = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
  ];

  const segmentedOptions = [
    { value: 'opt1', label: 'Opt 1' },
    { value: 'opt2', label: 'Opt 2' },
    { value: 'opt3', label: 'Opt 3' },
  ];

  const chipOptions = [
    { value: 'chip1', label: 'Chip 1' },
    { value: 'chip2', label: 'Chip 2' },
    { value: 'chip3', label: 'Chip 3' },
  ];

  const searchableDropdownOptions = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Mango', value: 'mango' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Quince', value: 'quince' },
    { label: 'Raspberry', value: 'raspberry' },
    { label: 'Strawberry', value: 'strawberry' },
  ];

  // Remove the entire DropDownPicker section
  //

  return (
    <View style={styles.inputTestingSection}>
      <Text style={styles.inputTestingTitle}>🧪 TEMP: Input Components Testing</Text>
      
      <EventDateTimePicker
        label="Event Date & Time"
        startTime={eventStartTime}
        endTime={eventEndTime}
        onStartTimeChange={setEventStartTime}
        onEndTimeChange={setEventEndTime}
      />
      
      <ImageUpload
        label="Image Upload"
        value={imageValue}
        onValueChange={setImageValue}
        placeholder="Add an image"
      />
      
      <Input
        label="label"
        value={inputValue}
        onValueChange={setInputValue}
        placeholder="Type here..."
      />
      
      <TextArea
        label="Multi Line Input"
        value={textAreaValue}
        onValueChange={setTextAreaValue}
        placeholder="Type your message..."
        maxLength={200}
      />
      
      <MultiSelect
                        label="Multi-Select"
        options={multiSelectOptions}
        selectedValues={multiSelectValue}
        onSelectionChange={setMultiSelectValue}
        title="Multi Select"
      />
      
      <SegmentedInput
        label="Segmented Input"
        value={segmentedValue}
        onValueChange={setSegmentedValue}
        options={segmentedOptions}
      />
      
      <ChipSelection
        label="Chip Selection"
        value={chipSelectionValue}
        onValueChange={(value) => setChipSelectionValue(Array.isArray(value) ? value : [value])}
        options={chipOptions}
        multiSelect={true}
      />
      
      <Checkbox
        label="Checkbox"
        value={checkboxValue}
        onValueChange={setCheckboxValue}
      />
      
      <Toggle
        label="Toggle"
        value={toggleValue}
        onValueChange={setToggleValue}
      />
      
      <NativeDateTimePicker
        label="Native DateTimePicker"
        value={nativeDateValue}
        onValueChange={setNativeDateValue}
        mode="datetime"
        minuteInterval={15}
      />

      <PaperDropdown
        label="Paper Dropdown"
        value={paperDropdownValue}
        onValueChange={setPaperDropdownValue}
        options={multiSelectOptions}
        placeholder="Select an option"
      />

      <SearchableDropdown
                        label="Searchable Dropdown"
        options={searchableDropdownOptions}
        value={searchableDropdownValue}
        onValueChange={setSearchableDropdownValue}
        placeholder="Search fruits..."
      />

      {/* Remove the duplicate EventDateTimePicker from here */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  footer: {
    height: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  errorText: {
    color: theme.colors.status.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.background.primary,
    fontWeight: '600',
  },
  noGatheringsContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noGatheringsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  noGatheringsSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  planLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  toggleButton: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Temporary testing styles
  tempTestingSection: {
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  tempTestingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  tempButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  tempButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    minWidth: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tempButtonText: {
    color: theme.colors.background.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  inputTestingSection: {
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  inputTestingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

});
