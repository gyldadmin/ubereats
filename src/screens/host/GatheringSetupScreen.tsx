import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { NavigationListItem, SetupListItem, TitleAndHostsSlider, DateTimeSlider, LocationSlider, MentorSlider, DescriptionSlider, GatheringTypeSlider, SettingsSlider } from '../../components/ui';
import { useHostData } from '../../hooks/useHostData';
import { useGatheringSetup } from '../../hooks/useGatheringSetup';
import { useSliderForm } from '../../hooks/useSliderForm';
import { supabase } from '../../services/supabase';
import { SetupItemStatus } from '../../types/gatheringSetup';

export default function GatheringSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get all host data using the enhanced convenience hook
  // Handles both existing gatherings and creates new unsaved gatherings automatically
  const {
    gatheringDetail,      // Current gathering details (all fields from gatherings, gathering_displays, gathering_other)
    gyldMembers,          // All members of current user's gyld
    activeMentors,        // Active mentors (approved, not expired, same gyld or matching metro/type)
    gyldGatherings,       // All gatherings in gyld (6 months ago to future)
    plannedWorkflows,     // All planned workflows for current gathering
    loading,              // Combined loading state (includes initialization)
    error,                // Combined error state (includes initialization)
    gatheringId,          // Current gathering ID (existing or newly created)
    initializationLoading, // Loading state for gathering creation/loading
    initializationError,  // Error state for gathering creation/loading
    refresh,              // Function to refresh all data
    saveGatheringData,    // Convenience function for saving with satellite creation and status promotion
    mentoring,            // Boolean indicating if this is mentoring mode
  } = useHostData(route.params);

  // Setup state management
  const {
    setupState,
    getSetupItemState,
    isSetupItemComplete,
    isReadyToLaunch,
    completedCount,
    totalCount,
    completionPercentage
  } = useGatheringSetup(gatheringId, gatheringDetail);

  // Visibility logic for setup items with loading state fallback
  const routeParams = route.params as any;
  const mentoringFromRoute = routeParams?.mentoring;
  
  // Use route params as fallback during loading, then switch to actual experience_type
  let showGatheringType: boolean;
  let showMentor: boolean;
  
  if (!gatheringDetail) {
    // Loading state: use mentoring boolean from route params
    showGatheringType = mentoringFromRoute === false;
    showMentor = mentoringFromRoute === true;
  } else {
    // Data loaded: use actual experience_type from database
    const isMentoring = gatheringDetail.gathering?.experience_type?.label === 'Mentoring';
    const hasExperienceType = gatheringDetail.gathering?.experience_type !== null && gatheringDetail.gathering?.experience_type !== undefined;
    
    // Show gathering type when: no experience_type OR experience_type is not Mentoring
    showGatheringType = !hasExperienceType || (hasExperienceType && !isMentoring);
    
    // Show mentor when: experience_type is Mentoring
    showMentor = hasExperienceType && isMentoring;
  }

  // Dynamic teaser text calculation functions
  const getGatheringTypeTeaser = (): string => {
    if (!gatheringDetail?.gathering?.experience_type) return '';
    return gatheringDetail.gathering.experience_type.label || '';
  };

  const getTitleAndHostsTeaser = (): string => {
    const title = gatheringDetail?.gathering?.title;
    return title ? title.trim() : '';
  };

  const getDateTimeTeaser = (): string => {
    const startTime = gatheringDetail?.gathering?.start_time;
    if (!startTime) return '';
    
    const date = new Date(startTime);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // Format time as "8 PM" or "8:30 PM"
    const timeStr = hour === 0 ? '12' : hour > 12 ? (hour - 12).toString() : hour.toString();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const minuteStr = minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`;
    
    return `${monthName} ${day}, ${timeStr}${minuteStr} ${ampm}`;
  };

  const getLocationTeaser = (): string => {
    const remote = gatheringDetail?.gatheringOther?.remote;
    const address = gatheringDetail?.gatheringDisplay?.address;
    
    if (remote === true) {
      return 'Remote';
    } else if (remote === false && address) {
      return address.trim();
    }
    return '';
  };

  const getMentorTeaser = (): string => {
    const mentorIds = gatheringDetail?.gatheringDisplay?.mentor;
    if (!mentorIds || mentorIds.length === 0) return '';
    
    // Look up the first mentor in activeMentors
    const mentorId = mentorIds[0];
    const mentor = activeMentors.find(m => m.id === mentorId);
    
    return mentor?.full_name || '';
  };

  const getDescriptionTeaser = (): string => {
    const description = gatheringDetail?.gatheringDisplay?.description;
    if (!description) return '';
    
    // Truncate to one line with ellipsis
    const maxLength = 60; // Approximate characters for one line
    const trimmed = description.trim();
    return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed;
  };

  // Button visibility and enable logic
  const shouldShowButtons = (): boolean => {
    const status = gatheringDetail?.gathering?.gathering_status?.label;
    return status === 'pre-launch' || status === 'unsaved';
  };

  const areButtonsEnabled = (): boolean => {
    // Must be pre-launch status
    if (gatheringDetail?.gathering?.gathering_status?.label !== 'pre-launch') {
      return false;
    }

    // Check if all visible setup items are COMPLETE or COMPLETE_TBD
    const visibleItems = [];
    
    // Add items based on visibility logic
    if (showGatheringType) visibleItems.push(getSetupItemState('gatheringType').status);
    visibleItems.push(getSetupItemState('titleAndHosts').status);
    visibleItems.push(getSetupItemState('dateTime').status);
    visibleItems.push(getSetupItemState('location').status);
    if (showMentor) visibleItems.push(getSetupItemState('mentor').status);
    visibleItems.push(getSetupItemState('description').status);

    // All visible items must be COMPLETE or COMPLETE_TBD
    return visibleItems.every(status => 
      status === SetupItemStatus.COMPLETE || status === SetupItemStatus.COMPLETE_TBD
    );
  };

  // Button handlers
  const handlePreview = () => {
    console.log('🎯 Preview button pressed');
    (navigation as any).navigate('EventDetail', { 
      gatheringData: {
        gathering: gatheringDetail?.gathering,
        gatheringDisplay: gatheringDetail?.gatheringDisplay,
        gatheringOther: gatheringDetail?.gatheringOther,
        mentorInfo: gatheringDetail?.mentorInfo,
        userRole: { isHost: true, isScribe: false, rsvpStatus: 'pending' },
        displayImage: gatheringDetail?.displayImage,
        formattedDate: gatheringDetail?.formattedDate,
        experienceTypeLabel: gatheringDetail?.experienceTypeLabel,
        hostNames: gatheringDetail?.hostNames,
      },
      previewMode: true // Flag to disable RSVP button
    });
  };

  const handleLaunch = async () => {
    console.log('🚀 Launch button pressed');
    try {
      // Get the 'launched' status ID
      const { data: launchedStatusData, error: statusLookupError } = await supabase
        .from('gathering_status')
        .select('id')
        .eq('label', 'launched')
        .single();

      if (statusLookupError) {
        console.error('Error fetching launched status:', statusLookupError);
        return;
      }

      // Update gathering status to launched
      const { error: updateError } = await supabase
        .from('gatherings')
        .update({ gathering_status: launchedStatusData.id })
        .eq('id', gatheringId);

      if (updateError) {
        console.error('Error launching gathering:', updateError);
        return;
      }

      console.log('✅ Gathering launched successfully');
      
      // Refresh data to reflect status change
      refresh();
      
      // Show "just_launched" popup
      setShowJustLaunchedPopup(true);
      
    } catch (error) {
      console.error('Error in handleLaunch:', error);
    }
  };

  // Modal states
  const [showGatheringTypeSlider, setShowGatheringTypeSlider] = useState(false);
  const [showTitleAndHostsSlider, setShowTitleAndHostsSlider] = useState(false);
  const [showDateTimeSlider, setShowDateTimeSlider] = useState(false);
  const [showLocationSlider, setShowLocationSlider] = useState(false);
  const [showMentorSlider, setShowMentorSlider] = useState(false);
  const [showDescriptionSlider, setShowDescriptionSlider] = useState(false);
  const [showSettingsSlider, setShowSettingsSlider] = useState(false);
  const [showJustLaunchedPopup, setShowJustLaunchedPopup] = useState(false);

  const handleTipsAndFAQs = () => {
    (navigation as any).navigate('GatheringResources');
  };

  const handleSettings = () => {
    console.log('Opening Settings slider');
    console.log('Current showSettingsSlider state:', showSettingsSlider);
    console.log('gatheringDetail?.gatheringOther:', gatheringDetail?.gatheringOther);
    setShowSettingsSlider(true);
    console.log('Set showSettingsSlider to true');
  };

  const handleGatheringType = () => {
    console.log('Opening Gathering Type slider');
    console.log('Current showGatheringTypeSlider state:', showGatheringTypeSlider);
    
    // Close all other modals first to prevent conflicts
    setShowTitleAndHostsSlider(false);
    setShowDateTimeSlider(false);
    setShowLocationSlider(false);
    setShowMentorSlider(false);
    setShowDescriptionSlider(false);
    setShowSettingsSlider(false);
    
    // Then open the GatheringTypeSlider
    setShowGatheringTypeSlider(true);
    console.log('Setting showGatheringTypeSlider to true');
  };

  // Handle gathering type slider close
  const handleCloseGatheringTypeSlider = () => {
    console.log('Closing Gathering Type slider');
    setShowGatheringTypeSlider(false);
  };

  const handleBasicInfo = () => {
    console.log('Opening Title and Hosts slider');
    setShowTitleAndHostsSlider(true);
  };

  // Handle title and hosts save
  const handleSaveTitleAndHosts = async (data: {
    title: string;
    hosts: string[];
    scribe?: string;
    image?: string;
  }) => {
    try {
      await saveGatheringData(async () => {
        // Update gatherings table with title and hosts
        const { error: gatheringError } = await supabase
          .from('gatherings')
          .update({
            title: data.title,
            host: data.hosts // host field is an array of user IDs
          })
          .eq('id', gatheringId);

        if (gatheringError) {
          console.error('Error updating gathering:', gatheringError);
          throw gatheringError;
        }

        // Update gathering_displays table with scribe and/or image (if provided)
        if (data.scribe || data.image) {
          const updateData: any = {};
          if (data.scribe) updateData.scribe = data.scribe;
          if (data.image) updateData.image = data.image;

          const { error: displayError } = await supabase
            .from('gathering_displays')
            .update(updateData)
            .eq('gathering_id', gatheringId);

          if (displayError) {
            console.error('Error updating gathering display:', displayError);
            throw displayError;
          }
        }

        // If gathering status is 'unsaved', change it to 'pre-launch'
        if (gatheringDetail?.gathering?.gathering_status?.label === 'unsaved') {
          console.log('📋 Changing gathering status from unsaved to pre-launch');
          
          // First, get the 'pre-launch' status ID
          const { data: preLaunchStatusData, error: statusLookupError } = await supabase
            .from('gathering_status')
            .select('id')
            .eq('label', 'pre-launch')
            .single();

          if (statusLookupError) {
            console.error('Error fetching pre-launch status:', statusLookupError);
            throw statusLookupError;
          }

          // Now update with the correct status ID
          const { error: statusError } = await supabase
            .from('gatherings')
            .update({
              gathering_status: preLaunchStatusData.id
            })
            .eq('id', gatheringId);

          if (statusError) {
            console.error('Error updating gathering status:', statusError);
            throw statusError;
          }
        }

        console.log('Title and hosts saved successfully:', data);
      }, (data.scribe || data.image) ? true : false); // Require satellites if scribe or image is provided
      
    } catch (error) {
      console.error('Error saving title and hosts:', error);
      throw error; // Re-throw to let the slider handle the error
    }
  };

  const handleDateTime = () => {
    console.log('Opening Date & Time slider');
    setShowDateTimeSlider(true);
  };

  const handleLocation = () => {
    console.log('Opening Location slider');
    setShowLocationSlider(true);
  };

  const handleMentor = () => {
    console.log('Opening Mentor slider');
    setShowMentorSlider(true);
  };

  const handleDescription = () => {
    console.log('Opening Description slider');
    setShowDescriptionSlider(true);
  };

  // Handle settings save
  const handleSettingsSave = async (data: any) => {
    try {
      await saveGatheringData(async () => {
        console.log('💾 Saving settings data:', data);
        
        // Update gathering_other table with all settings data
        const { error: otherError } = await supabase
          .from('gathering_other')
          .update({
            cap: data.cap,
            payment_to_member: data.payment_to_member,
            payment_for: data.payment_for,
            payment_amount: data.payment_amount,
            payment_venmo: data.payment_venmo,
            hold_autoreminders: data.hold_autoreminders,
            signup_question: data.signup_question,
            plus_guests: data.plus_guests,
            potluck: data.potluck,
          })
          .eq('gathering', gatheringId);

        if (otherError) {
          console.error('Error saving settings data:', otherError);
          throw otherError;
        }

        console.log('✅ Settings data saved successfully');
      }, false); // Don't change status for settings changes
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  // Handle potluck contribution
  const handlePotluckContribution = async (contribution: string) => {
    try {
      // Query current user from auth store
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User authentication required');
      }

      // Check if user already has a potluck entry for this gathering
      const { data: existingRecord, error: checkError } = await supabase
        .from('potluck')
        .select('id')
        .eq('user_id', user.id)
        .eq('gathering_id', gatheringId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing potluck record:', checkError);
        throw checkError;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('potluck')
          .update({ contribution: contribution.trim() })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('Error updating potluck record:', updateError);
          throw updateError;
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('potluck')
          .insert({
            user_id: user.id,
            gathering_id: gatheringId,
            contribution: contribution.trim()
          });

        if (insertError) {
          console.error('Error creating potluck record:', insertError);
          throw insertError;
        }
      }

      console.log('✅ Potluck contribution saved successfully');
    } catch (error) {
      console.error('Error handling potluck contribution:', error);
      throw error;
    }
  };

  // Show loading state during initialization
  if (initializationLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Setting up your gathering...</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {initializationError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => refresh()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show empty state if no gathering ID (shouldn't happen with new flow)
  if (!gatheringId) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>No gathering available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Setup Checklist */}
        <View style={styles.setupSection}>
          {/* Only show Gathering Type setup item for NON-Mentoring experience types */}
          {showGatheringType && (
            <SetupListItem
              title="Gathering Type"
              status={getSetupItemState('gatheringType').status}
              teaserText={getGatheringTypeTeaser()}
              onPress={handleGatheringType}
              showTopDivider={true}
            />
          )}
          
          <SetupListItem
            title="Title and Hosts"
            status={getSetupItemState('titleAndHosts').status}
            teaserText={getTitleAndHostsTeaser()}
            onPress={handleBasicInfo}
          />
          
          <SetupListItem
            title="Date & Time"
            status={getSetupItemState('dateTime').status}
            teaserText={getDateTimeTeaser()}
            onPress={handleDateTime}
          />
          
          <SetupListItem
            title="Location"
            status={getSetupItemState('location').status}
            teaserText={getLocationTeaser()}
            onPress={handleLocation}
          />
          
          {/* Only show mentor setup item for Mentoring experience types */}
          {showMentor && (
            <SetupListItem
              title="Mentor"
              status={getSetupItemState('mentor').status}
              teaserText={getMentorTeaser()}
              onPress={handleMentor}
            />
          )}
          
          <SetupListItem
            title="Description"
            status={getSetupItemState('description').status}
            teaserText={getDescriptionTeaser()}
            onPress={handleDescription}
          />
          
          {/* Ideas and FAQ link */}
          <View style={styles.ideasFAQRow}>
            <TouchableOpacity onPress={handleTipsAndFAQs}>
              <Text style={styles.ideasFAQText}>Ideas and FAQ &gt;</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettings}>
              <Feather name="settings" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gathering Type Slider */}
        <GatheringTypeSlider
          visible={showGatheringTypeSlider}
          onClose={handleCloseGatheringTypeSlider}
          initialData={{
            experienceType: typeof gatheringDetail?.gathering?.experience_type === 'string' 
              ? gatheringDetail.gathering.experience_type 
              : (gatheringDetail?.gathering?.experience_type as any)?.id || '',
          }}
          onSave={async (data) => {
            await saveGatheringData(async () => {
              // Update gatherings table with selected experience type
              const { error } = await supabase
                .from('gatherings')
                .update({
                  experience_type: data.experienceType
                })
                .eq('id', gatheringId);

              if (error) {
                console.error('Error saving gathering type:', error);
                throw error;
              }
            }, false);
          }}
        />

        {/* Title and Hosts Slider */}
        <TitleAndHostsSlider
          visible={showTitleAndHostsSlider}
          onClose={() => setShowTitleAndHostsSlider(false)}
          initialData={{
            title: gatheringDetail?.gathering?.title || '',
            hosts: gatheringDetail?.gathering?.host || [],
            scribe: gatheringDetail?.gatheringDisplay?.scribe || '',
            image: gatheringDetail?.gatheringDisplay?.image || '',
          }}
          experienceType={
            typeof gatheringDetail?.gathering?.experience_type === 'string' 
              ? gatheringDetail.gathering.experience_type 
              : (gatheringDetail?.gathering?.experience_type as any)?.label || ''
          }
          onSave={handleSaveTitleAndHosts}
        />

        {/* Date & Time Slider */}
        <DateTimeSlider
          visible={showDateTimeSlider}
          onClose={() => setShowDateTimeSlider(false)}
          initialData={{
            startTime: gatheringDetail?.gathering?.start_time ? new Date(gatheringDetail.gathering.start_time) : undefined,
            endTime: gatheringDetail?.gathering?.end_time ? new Date(gatheringDetail.gathering.end_time) : undefined,
          }}
          gatheringDetail={gatheringDetail}
          gyldGatherings={gyldGatherings}
          mentoring={mentoring}
          onSave={async (data) => {
            await saveGatheringData(async () => {
              console.log('Saving date/time:', data);
              
              // Update gatherings table with start_time and end_time
              const { error: gatheringError } = await supabase
                .from('gatherings')
                .update({
                  start_time: data.startTime.toISOString(),
                  end_time: data.endTime.toISOString()
                })
                .eq('id', gatheringId);

              if (gatheringError) {
                console.error('Error updating gathering date/time:', gatheringError);
                throw gatheringError;
              }

              console.log('Date/time saved successfully:', data);
            }, false);
          }}
        />

        {/* Location Slider */}
        <LocationSlider
          visible={showLocationSlider}
          onClose={() => setShowLocationSlider(false)}
          experienceType={gatheringDetail?.gathering?.experience_type?.label}
          initialData={{
            address: gatheringDetail?.gatheringDisplay?.address || '',
            meeting_link: gatheringDetail?.gatheringDisplay?.meeting_link || '',
            location_instructions: gatheringDetail?.gatheringDisplay?.location_instructions || '',
            location_tbd: gatheringDetail?.gatheringOther?.location_tbd || false,
            remote: gatheringDetail?.gatheringOther?.remote || false,
          }}
          onSave={async (data) => {
            await saveGatheringData(async () => {
              console.log('Saving location data:', data);
              
              // Update gathering_displays table with address, meeting_link, and location_instructions
              const displayUpdates: any = {};
              if (data.address !== undefined) displayUpdates.address = data.address;
              if (data.meeting_link !== undefined) displayUpdates.meeting_link = data.meeting_link;
              if (data.location_instructions !== undefined) displayUpdates.location_instructions = data.location_instructions;

              if (Object.keys(displayUpdates).length > 0) {
                const { error: displayError } = await supabase
                  .from('gathering_displays')
                  .update(displayUpdates)
                  .eq('gathering_id', gatheringId);

                if (displayError) {
                  console.error('Error updating gathering display:', displayError);
                  throw displayError;
                }
              }

              // Update gathering_other table with location_tbd and remote
              const otherUpdates: any = {};
              if (data.location_tbd !== undefined) otherUpdates.location_tbd = data.location_tbd;
              if (data.remote !== undefined) otherUpdates.remote = data.remote;

              if (Object.keys(otherUpdates).length > 0) {
                const { error: otherError } = await supabase
                  .from('gathering_other')
                  .update(otherUpdates)
                  .eq('gathering', gatheringId);

                if (otherError) {
                  console.error('Error updating gathering other:', otherError);
                  throw otherError;
                }
              }

              console.log('Location data saved successfully:', data);
            }, true);
          }}
        />

        {/* Mentor Slider */}
        <MentorSlider
          visible={showMentorSlider}
          onClose={() => setShowMentorSlider(false)}
          experienceType={gatheringDetail?.gathering?.experience_type?.label}
          initialData={{
            mentors: Array.isArray(gatheringDetail?.gatheringDisplay?.mentor) 
              ? gatheringDetail.gatheringDisplay.mentor 
              : (gatheringDetail?.gatheringDisplay?.mentor ? [gatheringDetail.gatheringDisplay.mentor] : []),
            learningTopic: typeof gatheringDetail?.gatheringDisplay?.learning_topic === 'string'
              ? gatheringDetail.gatheringDisplay.learning_topic
              : (gatheringDetail?.gatheringDisplay?.learning_topic as any)?.id || '',
          }}
          onSave={async (data) => {
            await saveGatheringData(async () => {
              console.log('�� Saving mentor data:', data);
              
              // Update gathering_displays with mentor array and learning_topic
              const { error: displayError } = await supabase
                .from('gathering_displays')
                .update({
                  mentor: data.mentors,
                  learning_topic: data.learningTopic || null
                })
                .eq('gathering_id', gatheringId);

              if (displayError) {
                console.error('Error saving mentor data:', displayError);
                throw displayError;
              }

              console.log('✅ Mentor data saved successfully');
            }, true);
          }}
        />

        {/* Description Slider */}
        <DescriptionSlider
          visible={showDescriptionSlider}
          onClose={() => setShowDescriptionSlider(false)}
          initialData={{
            description: gatheringDetail?.gatheringDisplay?.description || '',
          }}
          experienceTypeId={
            typeof gatheringDetail?.gathering?.experience_type === 'string' 
              ? gatheringDetail.gathering.experience_type 
              : (gatheringDetail?.gathering?.experience_type as any)?.id || ''
          }
          experienceTypeLabel={
            typeof gatheringDetail?.gathering?.experience_type === 'string' 
              ? gatheringDetail.gathering.experience_type 
              : (gatheringDetail?.gathering?.experience_type as any)?.label || ''
          }
          gatheringId={gatheringId || ''}
          onSave={async (data) => {
            await saveGatheringData(async () => {
              console.log('💾 Saving description data:', data);
              
              // Update gathering_displays with description
              const { error: displayError } = await supabase
                .from('gathering_displays')
                .update({
                  description: data.description
                })
                .eq('gathering_id', gatheringId);

              if (displayError) {
                console.error('Error saving description data:', displayError);
                throw displayError;
              }

              console.log('✅ Description data saved successfully');
            }, true);
          }}
        />

        {/* Settings Slider */}
        <SettingsSlider
          visible={showSettingsSlider}
          onClose={() => setShowSettingsSlider(false)}
          initialData={{
            cap: gatheringDetail?.gatheringOther?.cap || null,
            payment_to_member: gatheringDetail?.gatheringOther?.payment_to_member || false,
            payment_for: gatheringDetail?.gatheringOther?.payment_for || null,
            payment_amount: gatheringDetail?.gatheringOther?.payment_amount || null,
            payment_venmo: gatheringDetail?.gatheringOther?.payment_venmo || null,
            hold_autoreminders: gatheringDetail?.gatheringOther?.hold_autoreminders || false,
            signup_question: gatheringDetail?.gatheringOther?.signup_question || '',
            plus_guests: gatheringDetail?.gatheringOther?.plus_guests || 0,
            potluck: gatheringDetail?.gatheringOther?.potluck || false,
          }}
          onSave={handleSettingsSave}
          onPotluckContribution={handlePotluckContribution}
        />
      </ScrollView>

      {/* Floating Action Buttons - Outside ScrollView */}
      {shouldShowButtons() && (
        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity
            style={[styles.previewButton]}
            onPress={handlePreview}
            disabled={!areButtonsEnabled()}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.previewButtonText,
              !areButtonsEnabled() && styles.disabledButtonText
            ]}>
              Preview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.launchButton,
              !areButtonsEnabled() && styles.disabledButton
            ]}
            onPress={handleLaunch}
            disabled={!areButtonsEnabled()}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.launchButtonText,
              !areButtonsEnabled() && styles.disabledButtonText
            ]}>
              Launch
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoButton}>
            <Feather 
              name="info" 
              size={18} 
              color={!areButtonsEnabled() ? theme.colors.text.tertiary : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Just Launched Popup */}
      <Modal
        visible={showJustLaunchedPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJustLaunchedPopup(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>🚀 Gathering Launched!</Text>
            <Text style={styles.popupMessage}>
              Your gathering is now live and visible to members. Notifications will be sent out automatically.
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowJustLaunchedPopup(false)}
            >
              <Text style={styles.popupButtonText}>Great!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to the bottom of the ScrollView
  },
  setupSection: {
    marginTop: theme.spacing.md + 50, // Add 50px space between nav bar and content
    marginBottom: theme.spacing.xl,
  },
  ideasFAQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: theme.spacing.lg + 3, // Increased by 3px as requested
    paddingRight: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginTop: 18, // Extra 18px margin above (10 + 8)
    // Removed borderTopWidth and borderTopColor to eliminate the line
  },
  ideasFAQText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },


  // Loading and error states
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.status?.error || '#e74c3c',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },

  // Modal Styles (following EventDetailScreen pattern)
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  placeholderText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },

  // Fixed bottom buttons
  modalButtons: {
    flexDirection: 'row',
    padding: theme.spacing.lg + 20, // Add 20px more space
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center', // Center buttons vertically in the larger space
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary, // Brand color when hasUnsavedChanges is true
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)', // Brand color at 35% opacity when hasUnsavedChanges is false
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
  saveButtonTextInactive: {
    color: theme.colors.text.secondary,
  },

  // Save Changes Popup Styles (following EventDetailScreen RSVP popup pattern)
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    width: 320,
    height: 240,
    elevation: 8,
    justifyContent: 'space-between',
  },
  popupTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  popupMessage: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  popupNoButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupNoButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  popupYesButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupYesButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },

  // Floating Action Buttons
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: theme.spacing.lg + 20,
    paddingBottom: theme.spacing.lg + 20,
    paddingLeft: 36,
    paddingRight: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'flex-start', // Align items to top for info button positioning
    zIndex: 1000,
    elevation: 10,
  },
  previewButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md, // Maintain spacing between buttons
  },
  launchButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    backgroundColor: 'transparent',
    paddingVertical: 0, // Remove padding to make it flush with button top
    paddingHorizontal: 0,
    marginLeft: 6, // 6px gap from launch button
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: theme.spacing.lg * 2 + 8, // Match button height (padding + text height)
  },
  previewButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  launchButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
  disabledButton: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)', // Brand color at 35% opacity - matches slider inactive
  },
  disabledButtonText: {
    color: theme.colors.text.secondary,
  },
  popupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
}); 