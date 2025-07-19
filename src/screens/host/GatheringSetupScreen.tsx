import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { NavigationListItem, SetupListItem, TitleAndHostsSlider, DateTimeSlider, LocationSlider, MentorSlider, DescriptionSlider, GatheringTypeSlider } from '../../components/ui';
import { useHostData } from '../../hooks/useHostData';
import { useGatheringSetup } from '../../hooks/useGatheringSetup';
import { useSliderForm } from '../../hooks/useSliderForm';
import { supabase } from '../../services/supabase';

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

  // Modal states
  const [showGatheringTypeSlider, setShowGatheringTypeSlider] = useState(false);
  const [showTitleAndHostsSlider, setShowTitleAndHostsSlider] = useState(false);
  const [showDateTimeSlider, setShowDateTimeSlider] = useState(false);
  const [showLocationSlider, setShowLocationSlider] = useState(false);
  const [showMentorSlider, setShowMentorSlider] = useState(false);
  const [showDescriptionSlider, setShowDescriptionSlider] = useState(false);

  const handleTipsAndFAQs = () => {
    (navigation as any).navigate('GatheringResources');
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
          const { error: statusError } = await supabase
            .from('gatherings')
            .update({
              gathering_status: 'pre-launch'
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
    <ScrollView style={styles.container}>
      {/* Setup Checklist */}
      <View style={styles.setupSection}>
        <SetupListItem
          title="Gathering Type"
          status={getSetupItemState('gatheringType').status}
          teaserText="Mentoring Salon"
          onPress={handleGatheringType}
          showTopDivider={true}
        />
        
        <SetupListItem
          title="Title and Hosts"
          status={getSetupItemState('titleAndHosts').status}
          teaserText="Professional Development Workshop"
          onPress={handleBasicInfo}
        />
        
        <SetupListItem
          title="Date & Time"
          status={getSetupItemState('dateTime').status}
          onPress={handleDateTime}
        />
        
        <SetupListItem
          title="Location"
          status={getSetupItemState('location').status}
          teaserText="166 Hampshire Rd, Cambridge, MA"
          onPress={handleLocation}
        />
        
        <SetupListItem
          title="Mentor"
          status={getSetupItemState('mentor').status}
          onPress={handleMentor}
        />
        
        <SetupListItem
          title="Description"
          status={getSetupItemState('description').status}
          onPress={handleDescription}
        />
        
        {/* Ideas and FAQ link */}
        <TouchableOpacity style={styles.ideasFAQRow} onPress={handleTipsAndFAQs}>
          <Text style={styles.ideasFAQText}>Ideas and FAQ &gt;</Text>
          <Feather name="settings" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
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
                .eq('gathering_id', gatheringId);

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
        initialData={{
          mentorIds: Array.isArray(gatheringDetail?.gatheringDisplay?.mentor) 
            ? gatheringDetail.gatheringDisplay.mentor 
            : (gatheringDetail?.gatheringDisplay?.mentor ? [gatheringDetail.gatheringDisplay.mentor] : []),
        }}
        mentorOptions={activeMentors?.map(mentor => ({
          value: mentor.user_id || mentor.id,
          label: mentor.full_name || 'Unknown Mentor',
          expertise: mentor.title || mentor.bio,
        })) || []}
        onSave={async (data) => {
          await saveGatheringData(async () => {
            console.log('Saving mentors:', data);
            // TODO: Implement actual save to database
            // Will save data.mentorIds to gathering_displays.mentor (UUID[])
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
        onSave={async (data) => {
          await saveGatheringData(async () => {
            console.log('Saving description:', data);
            // TODO: Implement actual save to database
          }, true);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  setupSection: {
    marginTop: theme.spacing.md + 50, // Add 50px space between nav bar and content
    marginBottom: theme.spacing.xl,
  },
  ideasFAQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
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
}); 