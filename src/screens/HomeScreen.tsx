import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Modal, Portal, Text } from 'react-native-paper';
import {
  Checkbox,
  ChipSelection,
  EventDateTimePicker,
  Input,
  MultiSelect,
  NativeDateTimePicker,
  PaperDropdown,
  SearchableDropdown,
  SegmentedInput,
  TextArea,
  Toggle
} from '../components/inputs';
import { GatheringCardCompactV1, ImageUpload } from '../components/ui';
import { WriteEmail } from '../components/ui/write-email';
import { getPushNotificationLogo, shouldIncludePushLogo } from '../constants/branding';
import type { GatheringCardData } from '../hooks/useHomeGatherings';
import { useHomeGatherings } from '../hooks/useHomeGatherings';
import { emailService } from '../services/emailService';
import { NotificationOrchestrator } from '../services/notificationOrchestrator';
import { PushService } from '../services/pushService';
import { pushTokenService } from '../services/pushTokenService';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { theme } from '../styles/theme';
import type { EmailServiceInputs } from '../types/email';
import type { OrchestrationInputs } from '../types/orchestration';
import type { PushServiceInputs } from '../types/push';

// Constants for expandable list behavior
const INITIAL_VISIBLE_COUNT = 3;

// Initialize services
const pushService = new PushService();
const notificationOrchestrator = new NotificationOrchestrator();

export default function HomeScreen() {
  const navigation = useNavigation();
  const { gatherings, loading, error, refresh, updateRSVP } = useHomeGatherings();
  const { userGyld } = useAuthStore();
  
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

  // Dummy Data Functions
  const handleDummy1CreateGylds = async () => {
    try {
      console.log('HomeScreen: Creating dummy gylds...');
      
      // Get current user ID to use as organizer
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'unknown-user';



      // Create Boston Product gyld
      const { data: bostonGyld, error: bostonError } = await supabase
        .from('gyld')
        .insert({
          name: 'Boston Product',
          user_id: userId
        })
        .select()
        .single();

      if (bostonError) {
        console.error('Error creating Boston Product gyld:', bostonError);
        alert(`❌ Error creating Boston Product gyld: ${bostonError.message}`);
        return;
      }

      // Create Seattle Product gyld
      const { data: seattleGyld, error: seattleError } = await supabase
        .from('gyld')
        .insert({
          name: 'Seattle Product',
          user_id: userId
        })
        .select()
        .single();

      if (seattleError) {
        console.error('Error creating Seattle Product gyld:', seattleError);
        alert(`❌ Error creating Seattle Product gyld: ${seattleError.message}`);
        return;
      }

      console.log('HomeScreen: Successfully created gylds', { bostonGyld, seattleGyld });
      alert(`✅ Successfully created gylds!\n\nBoston Product ID: ${bostonGyld.id}\nSeattle Product ID: ${seattleGyld.id}`);
      
    } catch (error) {
      console.error('HomeScreen: Error creating dummy gylds', error);
      alert(`❌ Error creating gylds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDummy2CreateUserData = async () => {
    try {
      console.log('HomeScreen: Creating dummy user data...');
      
      // Get Boston Product gyld ID
      const { data: bostonGyld, error: gyldError } = await supabase
        .from('gyld')
        .select('id')
        .eq('name', 'Boston Product')
        .single();

      if (gyldError || !bostonGyld) {
        alert('❌ Boston Product gyld not found. Please run Dummy1 first.');
        return;
      }

      // Get all existing users
      const { data: existingUsers, error: usersError } = await supabase
        .from('users_public')
        .select('user_id, first, full_name, email')
        .limit(4);

      if (usersError || !existingUsers || existingUsers.length === 0) {
        alert('❌ No existing users found in users_public table.');
        return;
      }

      // Get metro and neighborhood for Boston
      let metroId, neighborhoodId, employerId;
      
      // Get or create metro
      const { data: metro, error: metroError } = await supabase
        .from('metro')
        .select('id')
        .eq('label', 'Boston')
        .single();

      if (metro) {
        metroId = metro.id;
      } else {
        const { data: newMetro, error: newMetroError } = await supabase
          .from('metro')
          .insert({ label: 'Boston' })
          .select()
          .single();
        metroId = newMetro?.id;
      }

      // Get or create neighborhood
      if (metroId) {
        const { data: neighborhood, error: neighborhoodError } = await supabase
          .from('neighborhood')
          .select('id')
          .eq('label', 'Back Bay')
          .single();

        if (neighborhood) {
          neighborhoodId = neighborhood.id;
        } else {
          const { data: newNeighborhood, error: newNeighborhoodError } = await supabase
            .from('neighborhood')
            .insert({ label: 'Back Bay', metro: metroId })
            .select()
            .single();
          neighborhoodId = newNeighborhood?.id;
        }
      }

      // Get or create employer
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('name', 'Product Corp')
        .single();

      if (employer) {
        employerId = employer.id;
      } else {
        const { data: newEmployer, error: newEmployerError } = await supabase
          .from('employers')
          .insert({
            name: 'Product Corp',
            location: 'Boston, MA',
            website: 'https://productcorp.com'
          })
          .select()
          .single();
        employerId = newEmployer?.id;
      }

      // Update users_public to be in Boston Product gyld
      const { error: updatePublicError } = await supabase
        .from('users_public')
        .update({
          gyld: bostonGyld.id,
          employer: employerId
        })
        .in('user_id', existingUsers.map(u => u.user_id));

      if (updatePublicError) {
        console.error('Error updating users_public:', updatePublicError);
        alert(`❌ Error updating users_public: ${updatePublicError.message}`);
        return;
      }

      // Create users_internal records
      const usersInternalData = existingUsers.map((user, index) => ({
        user_id: user.user_id,
        user_status: 'active',
        proflink: `https://linkedin.com/in/${user.first?.toLowerCase() || 'user'}${index + 1}`,
        neighborhood: neighborhoodId,
        start_field: new Date(Date.now() - (index + 1) * 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6-24 months ago
        phone_number: `+1-617-555-010${index + 1}`,
        notification_preferences: JSON.stringify({ email: true, push: index % 2 === 0, sms: false })
      }));

      const { error: internalError } = await supabase
        .from('users_internal')
        .upsert(usersInternalData, { onConflict: 'user_id' });

      if (internalError) {
        console.error('Error creating users_internal:', internalError);
        alert(`❌ Error creating users_internal: ${internalError.message}`);
        return;
      }

      // Create users_private records
      const usersPrivateData = existingUsers.map((user, index) => ({
        user_id: user.user_id,
        onboard_status: 90 + (index * 2), // 90, 92, 94, 96
        founding_member: index === 0,
        notification_preferences: JSON.stringify({
          email_frequency: index % 2 === 0 ? 'daily' : 'weekly',
          push_quiet_hours: { start: '22:00', end: '08:00' }
        }),
        push_enabled: index % 2 === 0
      }));

      const { error: privateError } = await supabase
        .from('users_private')
        .upsert(usersPrivateData, { onConflict: 'user_id' });

      if (privateError) {
        console.error('Error creating users_private:', privateError);
        alert(`❌ Error creating users_private: ${privateError.message}`);
        return;
      }

      console.log('HomeScreen: Successfully created user data for', existingUsers.length, 'users');
      alert(`✅ Successfully created user data!\n\nUpdated ${existingUsers.length} users in Boston Product gyld\nCreated users_internal and users_private records`);
      
    } catch (error) {
      console.error('HomeScreen: Error creating dummy user data', error);
      alert(`❌ Error creating user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDummy3CreateGatherings = async () => {
    try {
      console.log('HomeScreen: Creating dummy gatherings...');
      
      // Get Boston Product gyld ID
      const { data: bostonGyld, error: gyldError } = await supabase
        .from('gyld')
        .select('id')
        .eq('name', 'Boston Product')
        .single();

      if (gyldError || !bostonGyld) {
        alert('❌ Boston Product gyld not found. Please run Dummy1 first.');
        return;
      }

      // Get gathering statuses
      const { data: launchedStatus } = await supabase
        .from('gathering_status')
        .select('id')
        .ilike('label', 'launched')
        .single();

      const { data: preLaunchStatus } = await supabase
        .from('gathering_status')
        .select('id')
        .eq('label', 'pre-launch')
        .single();

      const { data: finishedStatus } = await supabase
        .from('gathering_status')
        .select('id')
        .eq('label', 'finished')
        .single();

      // Get experience type
      const { data: experienceType } = await supabase
        .from('experience_type')
        .select('id')
        .limit(1)
        .single();

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'unknown-user';

      // Create three gatherings
      const gatheringsData = [
        {
          title: 'Product Strategy Workshop: Building Roadmaps That Matter',
          description: 'Join us for an interactive workshop on creating product roadmaps that align with business goals and user needs. We\'ll cover prioritization frameworks, stakeholder alignment, and communication strategies.',
          location: 'WeWork Back Bay, 501 Boylston St, Boston, MA',
          date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          max_participants: 20,
          current_participants: 8,
          gathering_status: launchedStatus?.id,
          experience_type: experienceType?.id,
          gyld: [bostonGyld.id],
          host: [userId],
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
        },
        {
          title: 'Design Systems Coffee Chat',
          description: 'Casual coffee meetup to discuss design systems, component libraries, and maintaining consistency across products. Perfect for designers and developers working on scalable design solutions.',
          location: 'Thinking Cup, 165 Tremont St, Boston, MA',
          date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          max_participants: 12,
          current_participants: 3,
          gathering_status: preLaunchStatus?.id,
          experience_type: experienceType?.id,
          gyld: [bostonGyld.id],
          host: [userId],
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          title: 'User Research Methods Deep Dive',
          description: 'We explored various user research methodologies including interviews, surveys, usability testing, and analytics. Great discussion on when to use each method and how to present findings to stakeholders.',
          location: 'Boston Public Library, Central Library, Boston, MA',
          date_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
          max_participants: 15,
          current_participants: 12,
          gathering_status: finishedStatus?.id,
          experience_type: experienceType?.id,
          gyld: [bostonGyld.id],
          host: [userId],
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
        }
      ];

      const { data: createdGatherings, error: gatheringsError } = await supabase
        .from('gatherings')
        .insert(gatheringsData)
        .select();

      if (gatheringsError) {
        console.error('Error creating gatherings:', gatheringsError);
        alert(`❌ Error creating gatherings: ${gatheringsError.message}`);
        return;
      }

      // Create gathering satellites for each gathering
      const satellitesData = [];

      // Satellites for first gathering (Product Strategy Workshop)
      if (createdGatherings[0]) {
        satellitesData.push(
          {
            gathering_id: createdGatherings[0].id,
            satellite_type: 'agenda',
            satellite_data: {
              items: [
                { time: '6:00 PM', title: 'Welcome & Introductions', duration: '15 min' },
                { time: '6:15 PM', title: 'Roadmap Frameworks Overview', duration: '30 min' },
                { time: '6:45 PM', title: 'Hands-on Workshop', duration: '45 min' },
                { time: '7:30 PM', title: 'Share & Feedback', duration: '20 min' },
                { time: '7:50 PM', title: 'Networking', duration: '10 min' }
              ]
            }
          },
          {
            gathering_id: createdGatherings[0].id,
            satellite_type: 'requirements',
            satellite_data: {
              items: [
                'Bring laptop or tablet',
                'Basic knowledge of product management helpful but not required',
                'We\'ll provide materials and templates'
              ]
            }
          }
        );
      }

      // Satellites for second gathering (Design Systems Coffee Chat)
      if (createdGatherings[1]) {
        satellitesData.push({
          gathering_id: createdGatherings[1].id,
          satellite_type: 'agenda',
          satellite_data: {
            items: [
              { time: '10:00 AM', title: 'Coffee & Casual Intros', duration: '15 min' },
              { time: '10:15 AM', title: 'Design System Challenges', duration: '30 min' },
              { time: '10:45 AM', title: 'Tool Recommendations', duration: '20 min' },
              { time: '11:05 AM', title: 'Open Discussion', duration: '25 min' }
            ]
          }
        });
      }

      // Satellites for third gathering (User Research Deep Dive)
      if (createdGatherings[2]) {
        satellitesData.push(
          {
            gathering_id: createdGatherings[2].id,
            satellite_type: 'agenda',
            satellite_data: {
              items: [
                { time: '7:00 PM', title: 'Welcome & Research Method Overview', duration: '20 min' },
                { time: '7:20 PM', title: 'Qualitative Methods Workshop', duration: '40 min' },
                { time: '8:00 PM', title: 'Quantitative Methods Workshop', duration: '40 min' },
                { time: '8:40 PM', title: 'Synthesis & Presentation Tips', duration: '15 min' },
                { time: '8:55 PM', title: 'Q&A & Wrap-up', duration: '5 min' }
              ]
            }
          },
          {
            gathering_id: createdGatherings[2].id,
            satellite_type: 'followup',
            satellite_data: {
              notes: 'Great turnout with engaged discussions on research ethics and recruiting participants. Several attendees expressed interest in forming a research practice group.',
              action_items: [
                'Create Slack channel for ongoing research discussions',
                'Schedule follow-up session on research tools',
                'Share recording of presentation (with permission)'
              ]
            }
          }
        );
      }

      if (satellitesData.length > 0) {
        const { error: satellitesError } = await supabase
          .from('gathering_satellites')
          .insert(satellitesData);

        if (satellitesError) {
          console.error('Error creating gathering satellites:', satellitesError);
          alert(`❌ Error creating gathering satellites: ${satellitesError.message}`);
          return;
        }
      }

      console.log('HomeScreen: Successfully created gatherings and satellites', createdGatherings);
      alert(`✅ Successfully created gatherings!\n\nCreated ${createdGatherings.length} gatherings with ${satellitesData.length} satellite records`);
      
    } catch (error) {
      console.error('HomeScreen: Error creating dummy gatherings', error);
      alert(`❌ Error creating gatherings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        initiated_by: userId,
        // Include company logo in test push
        ...(shouldIncludePushLogo() && {
          image_url: getPushNotificationLogo()
        })
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

  // Handle test gathering invitation with content templates
  
const handleTestGatheringInviteWithTemplates = async () => {
    try {
      console.log('HomeScreen: Testing gathering invitation with content templates...');
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'test-user-id';
      
      if (!userGyld) {
        alert('❌ No gyld found for current user. Cannot determine recipients.');
        return;
      }

      // Find most recent launched gathering
      console.log('HomeScreen: Finding most recent launched gathering...');
      const { data: launchedStatusData, error: statusError } = await supabase
        .from('gathering_status')
        .select('id')
        .ilike('label', 'launched')
        .single();

      if (statusError) {
        console.error('Error fetching launched status:', statusError);
        alert('❌ Error finding launched status in database');
        return;
      }

      const { data: gatheringData, error: gatheringError } = await supabase
        .from('gatherings')
        .select(`
          id,
          title,
          host,
          experience_type,
          start_time,
          end_time,
          updated_at
        `)
        .eq('gathering_status_id', launchedStatusData.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (gatheringError || !gatheringData || gatheringData.length === 0) {
        console.error('Error fetching gathering:', gatheringError);
        alert('❌ No launched gatherings found in database');
        return;
      }

      const gathering = gatheringData[0];
      console.log('HomeScreen: Found gathering:', gathering);

      // Get all users in the same gyld as recipients
      console.log('HomeScreen: Finding gyld members...');
      const { data: gyldUsers, error: usersError } = await supabase
        .from('users_public')
        .select('user_id, first_name, full_name')
        .eq('gyld', userGyld);

      if (usersError || !gyldUsers || gyldUsers.length === 0) {
        console.error('Error fetching gyld users:', usersError);
        alert('❌ No gyld members found');
        return;
      }

      const recipientUserIds = gyldUsers.map(u => u.user_id);
      console.log(`HomeScreen: Sending to ${recipientUserIds.length} gyld members`);

      // Format gathering date
      const gatheringDate = gathering.start_time ? 
        new Date(gathering.start_time).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }) : 'TBD';

      // Create template variables mapping
      const templateVariables = {
        gathering_title: gathering.title || 'Untitled Event',
        host_name: gathering.host?.[0] ? 'Host' : 'Unknown Host', // Simplified for now
        experience_type: 'Event', // Simplified for now  
        gathering_date: gatheringDate,
        gathering_location: 'TBD',
        first_name: 'Member', // Will be replaced per user
        attendee_count: 0
      };

      // Create orchestration inputs using content templates
      const testInviteInputs: OrchestrationInputs = {
        mode: 'push_preferred',
        users: recipientUserIds,
        send_date: new Date(), // Send immediately
        
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
      const result = await notificationOrchestrator.send(testInviteInputs);
      
      if (result.success) {
        console.log('HomeScreen: Test gathering invitation completed successfully', result);
        
        const pushInfo = result.push_results?.attempted ? 
          `Push: ${result.push_results.success ? `✅ ${result.push_results.sent_count} sent` : `❌ ${result.push_results.failed_count} failed`}` : 
          'Push: Not attempted';
          
        const emailInfo = result.email_results?.attempted ? 
          `Email: ${result.email_results.success ? `✅ ${result.email_results.sent_count} sent` : `❌ ${result.email_results.failed_count} failed`}` : 
          'Email: Not attempted';
          
        alert(`✅ Gathering invitation sent!\n\n${pushInfo}\n${emailInfo}\n\nGathering: ${gathering.title}\nRecipients: ${recipientUserIds.length} members\n\nMessage: ${result.message}`);
      } else {
        console.error('HomeScreen: Test gathering invitation failed', result);
        alert(`❌ Gathering invitation failed!\n\nError: ${result.error || result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error in test gathering invitation', error);
      alert(`❌ Gathering invitation error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle realistic gathering invitation test
  const handleTestGatheringInvitation = async () => {
    try {
      console.log('HomeScreen: Simulating realistic gathering invitation...');
      
      // Get current user (this will be "User A" - the creator)
      const { data: { user } } = await supabase.auth.getUser();
      const creatorId = user?.id || 'test-creator-id';
      
      // Test user IDs - add more test accounts here  
      const testUserIds = [
        '999b2ec0-aa76-4a42-99f5-6d5b0ac7bce5', // wtriant@yahoo.com
        // Add more test user IDs when you create them via Supabase Dashboard:
        // 'uuid-for-testuser-b@gyld.com',
        // 'uuid-for-testuser-c@gyld.com'
      ];
      
      // For this test, send to all test users
      const inviteeUserIds = testUserIds;
      
      console.log(`HomeScreen: Sending gathering invitation to ${inviteeUserIds.length} users:`, inviteeUserIds);
      
      // Simulate realistic gathering data (what User A just created)
      const mockGathering = {
        id: 'test-gathering-123',
        title: 'Friday Happy Hour at The Rooftop',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        location: 'The Rooftop Bar, Downtown',
        host_name: 'Sarah Chen', // User A's name
        experience_type: 'Happy Hour',
        max_participants: 8,
        current_participants: 2
      };
      
      // Create realistic invitation using orchestration
      const gatheringInviteInputs: OrchestrationInputs = {
        mode: 'push_preferred', // Try push first, fallback to email
        users: inviteeUserIds,
        send_date: new Date(), // Send immediately
        
        // Realistic content
        title: `You're invited: ${mockGathering.title}`,
        subtitle: `Hosted by ${mockGathering.host_name}`,
        content: `Join us for ${mockGathering.experience_type} on ${mockGathering.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })} at ${mockGathering.location}. ${mockGathering.current_participants}/${mockGathering.max_participants} spots filled.`,
        
        secondary_content: `This looks like a great opportunity to connect with fellow Gyld members! The host has organized a ${mockGathering.experience_type.toLowerCase()} experience and you're one of the select invitees.`,
        
        // Deep links to the actual gathering detail screen
        deep_link: `GatheringDetailScreen?gatheringId=${mockGathering.id}&tab=details`,
        
        // Action buttons
        button1_text: 'Accept Invite',
        button1_url: `GatheringDetailScreen?gatheringId=${mockGathering.id}&action=accept`,
        button2_text: 'View Details',
        button2_url: `GatheringDetailScreen?gatheringId=${mockGathering.id}`,
        button3_text: 'Maybe Later',
        button3_url: `HomeScreen?tab=invitations`,
        
        // Email-specific fields (for fallback)
        email_template_name: 'invite_with_envelope',
        email_type: 'gathering_invitation',
        sender_fullname: 'Gyld Community',
        
        // Metadata
        initiated_by: creatorId,
        gathering_ID: mockGathering.id,
        
        // Content template integration (if you want to use dynamic templates)
        content_key: 'gathering_invitation',
        template_variables: {
          host_name: mockGathering.host_name,
          gathering_title: mockGathering.title,
          gathering_date: mockGathering.date.toLocaleDateString(),
          gathering_location: mockGathering.location,
          spots_remaining: (mockGathering.max_participants - mockGathering.current_participants).toString()
        }
      };

      // Send the invitation
      const result = await notificationOrchestrator.orchestrate(gatheringInviteInputs);
      
      if (result.success) {
        console.log('HomeScreen: Gathering invitation sent successfully', result);
        
        const pushSuccess = result.pushResult?.success ? '✅' : '❌';
        const emailSuccess = result.emailResult?.success ? '✅' : '❌';
        
        alert(`🎉 Gathering Invitation Sent!\n\n` +
              `📝 Gathering: ${mockGathering.title}\n` +
              `👥 Invitees: ${inviteeUserIds.length}\n\n` +
              `${pushSuccess} Push: ${result.pushResult?.message || 'Not sent'}\n` +
              `${emailSuccess} Email: ${result.emailResult?.message || 'Not sent'}\n\n` +
              `💡 Check your notifications!`);
      } else {
        console.error('HomeScreen: Gathering invitation failed', result);
        alert(`❌ Invitation Failed!\n\nError: ${result.error}\n\nDetails: ${JSON.stringify(result, null, 2)}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error sending gathering invitation', error);
      alert(`❌ Invitation Error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle dynamic email test (demonstrates fresh data fetching at send time)
  const handleTestDynamicEmail = async () => {
    try {
      console.log('HomeScreen: Testing new dynamic email system...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      if (!currentUserId) {
        alert('❌ User not authenticated');
        return;
      }
      
      // Create a test gathering ID (in real usage, you'd get this from context)
      const testGatheringId = 'test-gathering-123'; // This would be a real gathering ID
      
      // Import the email service 
      const { emailService } = await import('../services/emailService');
      
      // Test with dynamic inputs - this demonstrates the new functionality!
      const dynamicEmailInputs = {
        template_name: 'basic_with_button',
        email_type: 'notification',
        sender_fullname: 'Gyld Dynamic Test',
        
        // Dynamic recipients - will fetch fresh RSVP list at send time
        recipient_source: {
          type: 'user_ids' as const,
          user_ids: [currentUserId] // Send to current user for testing
        },
        
        // Dynamic content - will render with fresh gathering data at send time  
        content_source: {
          template_key: 'gathering_reminder',
          dynamic_data_sources: {
            gathering_id: testGatheringId,
            user_id: currentUserId
          }
        },
        
        // Send immediately for testing
        send_date: new Date(),
        
        initiated_by: currentUserId,
        gathering_ID: testGatheringId,
        
        // Fallback static content (in case content_source fails)
        subject: 'Dynamic Email Test',
        body1: 'This email was sent using dynamic inputs!',
        buttontext: 'View Gathering',
        buttonurl: 'https://app.gyld.org/gathering/' + testGatheringId,
        unsubscribeurl: 'https://app.gyld.org/unsubscribe'
      };
      
      console.log('HomeScreen: Sending dynamic email...', { dynamicEmailInputs });
      
      const result = await emailService.send(dynamicEmailInputs);
      
      if (result.success) {
        console.log('HomeScreen: Dynamic email sent successfully', result);
        alert(`🎉 Dynamic Email Sent!\n\n` +
              `✅ Success: ${result.message}\n` +
              `📧 Email ID: ${result.emailId}\n\n` +
              `💡 Check your email inbox!\n\n` +
              `🔄 This email used:\n` +
              `• Dynamic recipients (user_ids)\n` + 
              `• Dynamic content (gathering_reminder template)\n` +
              `• Fresh data fetched at send time!`);
      } else {
        console.error('HomeScreen: Dynamic email failed', result);
        alert(`❌ Dynamic Email Failed!\n\nError: ${result.error}\n\nMessage: ${result.message}`);
      }
      
    } catch (error) {
      console.error('HomeScreen: Error testing dynamic email', error);
      alert(`❌ Dynamic Email Error!\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              onPress={handleTestGatheringInvitation}
            >
              <Text style={styles.tempButtonText}>🎉 Test Gathering Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleTestDynamicEmail}
            >
              <Text style={styles.tempButtonText}>🔄 Test Dynamic Email</Text>
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
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleDummy1CreateGylds}
            >
              <Text style={styles.tempButtonText}>🏢 Dummy1: Create Gylds</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleDummy2CreateUserData}
            >
              <Text style={styles.tempButtonText}>👥 Dummy2: User Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tempButton}
              onPress={handleDummy3CreateGatherings}
            >
              <Text style={styles.tempButtonText}>📅 Dummy3: Gatherings</Text>
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

  /* WriteEmail demo modal */
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  const recipientOptions = [
    { id: 'u1', email: 'alice@example.com', name: 'Alice' },
    { id: 'u2', email: 'bob@example.com', name: 'Bob' },
    { id: 'u3', email: 'carol@example.com', name: 'Carol' },
  ];

  const handleEmailSubmit = (payload: any) => {
    console.log('📧 WriteEmail payload', payload);
    setEmailModalVisible(false);
  };
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

      {/* Demo WriteEmail button */}
      <Button mode="contained" onPress={() => setEmailModalVisible(true)} style={{ marginBottom: theme.spacing.md }}>
        Test WriteEmail Component
      </Button>

      <Portal>
        <Modal
          visible={emailModalVisible}
          onDismiss={() => setEmailModalVisible(false)}
          contentContainerStyle={{ margin: 20, backgroundColor: 'white', padding: 20, borderRadius: 8 }}
        >
          <WriteEmail
            type="user-defined_recipients"
            recipientOptions={recipientOptions}
            onSubmit={handleEmailSubmit}
          />
        </Modal>
      </Portal>
      
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
