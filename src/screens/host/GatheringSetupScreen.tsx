import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { NavigationListItem, SetupListItem, TitleAndHostsSlider } from '../../components/ui';
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
    saveGatheringData     // Convenience function for saving with satellite creation and status promotion
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
  } = useGatheringSetup(gatheringId);

  // Modal states
  const [showGatheringTypeSlider, setShowGatheringTypeSlider] = useState(false);
  const [showTitleAndHostsSlider, setShowTitleAndHostsSlider] = useState(false);
  const [showSaveChangesPopup, setShowSaveChangesPopup] = useState(false);

  // Form state management for gathering type slider
  const {
    formData: gatheringTypeData,
    savedData: savedGatheringTypeData,
    hasUnsavedChanges: hasUnsavedGatheringTypeChanges,
    updateFormData: updateGatheringTypeData,
    saveFormData: saveGatheringTypeData,
    resetFormData: resetGatheringTypeData
  } = useSliderForm(
    {
      gatheringType: 'mentoring' // Default value
    },
    async (data) => {
      // Save function - will implement actual database save later
      console.log('Saving gathering type data:', data);
      // TODO: Implement actual save to database/store
    }
  );

  const handleTipsAndFAQs = () => {
    (navigation as any).navigate('GatheringResources');
  };

  const handleGatheringType = () => {
    console.log('Opening Gathering Type slider');
    setShowGatheringTypeSlider(true);
  };

  // Handle gathering type slider close
  const handleCloseGatheringTypeSlider = () => {
    if (hasUnsavedGatheringTypeChanges) {
      setShowSaveChangesPopup(true);
    } else {
      setShowGatheringTypeSlider(false);
    }
  };

  // Handle save changes popup responses
  const handleSaveChanges = () => {
    // Save the data
    saveGatheringTypeData();
    setShowSaveChangesPopup(false);
    setShowGatheringTypeSlider(false);
  };

  const handleDiscardChanges = () => {
    // Reset form data to saved state
    resetGatheringTypeData();
    setShowSaveChangesPopup(false);
    setShowGatheringTypeSlider(false);
  };

  // Handle gathering type save button
  const handleSaveGatheringType = async () => {
    try {
      // Use the convenience function that handles satellites and status promotion
      await saveGatheringData(async () => {
        // TODO: Implement actual gathering type save to database
        // This will save to the main gatherings table: { experience_type: selectedType }
        // For now, just save to local form state
        saveGatheringTypeData();
        console.log('Gathering type saved:', gatheringTypeData);
      }, false); // gathering_type doesn't require satellites
      
      setShowGatheringTypeSlider(false);
    } catch (error) {
      console.error('Error saving gathering type:', error);
      // TODO: Show error message to user
    }
  };

  /**
   * Example of how other setup items will use saveGatheringData:
   * 
   * Title/Hosts: saveGatheringData(() => supabase.from('gatherings').update({title, host}), false)
   * Date/Time: saveGatheringData(() => supabase.from('gatherings').update({start_time, end_time}), false) 
   * Location: saveGatheringData(() => supabase.from('gathering_displays').update({address}), true)
   * Mentor: saveGatheringData(() => supabase.from('gathering_displays').update({mentor}), true)
   * Description: saveGatheringData(() => supabase.from('gathering_displays').update({description}), true)
   * 
   * The function automatically:
   * 1. Creates gathering_displays/gathering_other if requiresSatellites=true
   * 2. Executes your save function
   * 3. Promotes status from "unsaved" to "pre-launch" (only on first save)
   * 4. Refreshes gathering data to show updates
   */

  // Handle gathering type cancel button
  const handleCancelGatheringType = () => {
    handleCloseGatheringTypeSlider();
  };

  const handleBasicInfo = () => {
    console.log('Opening Title and Hosts slider');
    setShowTitleAndHostsSlider(true);
  };

  // Handle title and hosts save
  const handleSaveTitleAndHosts = async (data: {
    title: string;
    hosts: string[];
    scribe: string;
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

        // Update gathering_displays table with scribe (only if scribe is provided)
        if (data.scribe) {
          const { error: displayError } = await supabase
            .from('gathering_displays')
            .update({
              scribe: data.scribe
            })
            .eq('gathering_id', gatheringId);

          if (displayError) {
            console.error('Error updating gathering display:', displayError);
            throw displayError;
          }
        }

        console.log('Title and hosts saved successfully:', data);
      }, data.scribe ? true : false); // Require satellites if scribe is provided
      
    } catch (error) {
      console.error('Error saving title and hosts:', error);
      throw error; // Re-throw to let the slider handle the error
    }
  };

  const handleDateTime = () => {
    console.log('Navigate to Date & Time setup');
    // TODO: Navigate to date & time setup
  };

  const handleLocation = () => {
    console.log('Navigate to Location setup');
    // TODO: Navigate to location setup
  };

  const handleMentor = () => {
    console.log('Navigate to Mentor setup');
    // TODO: Navigate to mentor setup
  };

  const handleDescription = () => {
    console.log('Navigate to Description setup');
    // TODO: Navigate to description setup
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
          <Text style={styles.ideasFAQText}>Ideas and FAQ ></Text>
          <Feather name="settings" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Gathering Type Slider Modal */}
      <Modal
        visible={showGatheringTypeSlider}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseGatheringTypeSlider}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={handleCloseGatheringTypeSlider}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Content will be replaced with actual inputs */}
          </ScrollView>

          {/* Fixed bottom buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelGatheringType}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !hasUnsavedGatheringTypeChanges && styles.saveButtonInactive
              ]}
              onPress={handleSaveGatheringType}
              disabled={!hasUnsavedGatheringTypeChanges}
            >
              <Text style={[
                styles.saveButtonText,
                !hasUnsavedGatheringTypeChanges && styles.saveButtonTextInactive
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save Changes Confirmation Popup */}
      <Modal
        visible={showSaveChangesPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveChangesPopup(false)}
      >
        <TouchableOpacity 
          style={styles.popupOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSaveChangesPopup(false)}
        >
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>Save Changes?</Text>
            <Text style={styles.popupMessage}>
              You have unsaved changes that will be lost if you continue.
            </Text>
            
            <View style={styles.popupButtons}>
              <TouchableOpacity 
                style={styles.popupNoButton}
                onPress={handleDiscardChanges}
              >
                <Text style={styles.popupNoButtonText}>No</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.popupYesButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.popupYesButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Title and Hosts Slider */}
      <TitleAndHostsSlider
        visible={showTitleAndHostsSlider}
        onClose={() => setShowTitleAndHostsSlider(false)}
        initialTitle={gatheringDetail?.gathering?.title || ''}
        initialHosts={gatheringDetail?.gathering?.host || []}
        initialScribe={gatheringDetail?.gatheringDisplay?.scribe || ''}
        experienceType={gatheringDetail?.gathering?.experience_type || ''}
        gyldMembers={gyldMembers || []}
        onSave={handleSaveTitleAndHosts}
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