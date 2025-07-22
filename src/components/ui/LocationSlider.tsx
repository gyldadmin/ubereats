import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { SingleLineInput, MultiLineInput } from './inputs';
import { CustomCheckbox } from './CustomCheckbox';

interface LocationData {
  address?: string;
  meeting_link?: string;
  location_instructions?: string;
  location_tbd?: boolean;
  remote?: boolean;
}

interface LocationSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: LocationData;
  onSave: (data: LocationData) => Promise<void>;
  experienceType?: string; // To determine if remote link should be visible
}

export const LocationSlider: React.FC<LocationSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  experienceType,
}) => {
  // Form state
  const [address, setAddress] = useState(initialData?.address || '');
  const [meetingLink, setMeetingLink] = useState(initialData?.meeting_link || '');
  const [locationInstructions, setLocationInstructions] = useState(initialData?.location_instructions || '');
  const [locationTbd, setLocationTbd] = useState(initialData?.location_tbd || false);
  const [remote, setRemote] = useState(initialData?.remote || false);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [meetingLinkError, setMeetingLinkError] = useState<string>('');
  const [remoteLinkPressed, setRemoteLinkPressed] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      setAddress(initialData?.address || '');
      setMeetingLink(initialData?.meeting_link || '');
      setLocationInstructions(initialData?.location_instructions || '');
      setLocationTbd(initialData?.location_tbd || false);
      setRemote(initialData?.remote || false);
      setMeetingLinkError('');
      setSaving(false);
    }
  }, [visible, initialData]);

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (not required)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Handle meeting link validation
  const handleMeetingLinkChange = (value: string) => {
    setMeetingLink(value);
    if (value.trim() && !isValidUrl(value)) {
      setMeetingLinkError('Please enter a valid URL (http:// or https://)');
    } else {
      setMeetingLinkError('');
    }
  };

  // Handle remote toggle
  const handleRemoteToggle = () => {
    const newRemoteValue = !remote;
    setRemote(newRemoteValue);
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = (): boolean => {
    return (
      address !== (initialData?.address || '') ||
      meetingLink !== (initialData?.meeting_link || '') ||
      locationInstructions !== (initialData?.location_instructions || '') ||
      locationTbd !== (initialData?.location_tbd || false) ||
      remote !== (initialData?.remote || false)
    );
  };

  // Save handler
  const handleSave = async () => {
    if (!hasUnsavedChanges() || saving) return;
    
    // Validate meeting link if remote is true
    if (remote && meetingLink.trim() && !isValidUrl(meetingLink)) {
      setMeetingLinkError('Please enter a valid URL before saving');
      return;
    }
    
    setSaving(true);
    try {
      const locationData: LocationData = {
        address: address.trim(),
        meeting_link: meetingLink.trim(),
        location_instructions: locationInstructions.trim(),
        location_tbd: locationTbd,
        remote: remote,
      };
      
      await onSave(locationData);
      onClose();
    } catch (error) {
      console.error('Error saving location data:', error);
      // Keep modal open on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  // Check if remote link should be visible based on experience type
  const shouldShowRemoteLink = (): boolean => {
    if (!experienceType) return false;
    const allowedTypes = ['Mentoring', 'Podcast Club', 'Social', 'Course'];
    return allowedTypes.includes(experienceType);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header - matching TitleAndHostsSlider exactly */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.scrollContent}>
            
            {/* Conditional rendering based on remote state */}
            <View style={styles.inputsContainer}>
              {/* Remote Inputs - positioned first so they show at top */}
              <View style={{opacity: remote ? 1 : 0, pointerEvents: remote ? 'auto' : 'none'}}>
                {/* Meeting Link Input - only show when remote */}
                {remote && (
                  <SingleLineInput
                    label="Meeting Link"
                    value={meetingLink}
                    onValueChange={handleMeetingLinkChange}
                    placeholder="https://zoom.us/..."
                    error={!!meetingLinkError}
                    autoCapitalize="none"
                  />
                )}
              </View>

              {/* In-Person Inputs */}
              <View style={{opacity: remote ? 0 : 1, pointerEvents: remote ? 'none' : 'auto'}}>
                {/* Address Input - only show when not remote */}
                {!remote && (
                  <SingleLineInput
                    label="Address"
                    value={address}
                    onValueChange={setAddress}
                    disabled={locationTbd}
                    placeholder="Enter gathering address"
                  />
                )}
                
                {/* Address TBD Checkbox - always takes space, invisible when remote */}
                <View style={[styles.checkboxContainer, {backgroundColor: 'transparent', marginTop: 8, marginBottom: theme.spacing.input_spacing}]}>
                  <TouchableOpacity
                    onPress={() => setLocationTbd(!locationTbd)}
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      alignSelf: 'flex-end',
                    }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderWidth: 1,
                        borderRadius: 3,
                        borderColor: locationTbd ? theme.colors.text.tertiary : theme.colors.border.light,
                        backgroundColor: locationTbd ? theme.colors.text.tertiary : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: 8,
                      }}
                    >
                      {locationTbd && (
                        <View
                          style={{
                            width: 5,
                            height: 8,
                            borderRightWidth: 2,
                            borderBottomWidth: 2,
                            borderColor: 'white',
                            transform: [{ rotate: '45deg' }],
                            marginTop: -1,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{color: theme.colors.text.tertiary, fontSize: 14, lineHeight: 16}}>Address TBD</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Instructions Input - always takes space, invisible when remote */}
                <MultiLineInput
                  label="Instructions / Getting In"
                  value={locationInstructions}
                  onValueChange={setLocationInstructions}
                  placeholder="Instructions (e.g. 'Check in at reception, go to the 20th floor, turn right')"
                  disabled={locationTbd}
                  numberOfLines={2}
                  maxLength={200}
                  showCharacterCount={false}
                  characterCountPosition="bottom-right"
                />
              </View>
            </View>

            {/* Remote Toggle Link - only visible for certain experience types */}
            {shouldShowRemoteLink() && (
              <View style={styles.remoteToggleContainer}>
                <TouchableOpacity 
                  onPress={handleRemoteToggle}
                  onPressIn={() => setRemoteLinkPressed(true)}
                  onPressOut={() => setRemoteLinkPressed(false)}
                  activeOpacity={1}
                >
                  <Text style={[
                    styles.remoteToggleText,
                    remoteLinkPressed && styles.remoteToggleTextPressed
                  ]}>
                    {remote ? 'Switch to In-Person' : 'Switch to Remote'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Extra padding at bottom for floating buttons */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>

        {/* Fixed bottom buttons */}
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!hasUnsavedChanges() || !!meetingLinkError) && styles.saveButtonInactive
            ]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges() || saving || !!meetingLinkError}
          >
            <Text style={[
              styles.saveButtonText,
              (!hasUnsavedChanges() || !!meetingLinkError) && styles.saveButtonTextInactive
            ]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal styles - matching TitleAndHostsSlider exactly
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 24 + (theme.spacing.sm * 2), // Same width as close button + padding
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  contentContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    paddingTop: 16, // Space for floating labels
    paddingBottom: 120, // Extra space for floating buttons
    gap: theme.spacing.input_spacing, // 54px spacing between all elements
  },
  
  // Input container styles
  inputsContainer: {
    // Container for input fields
  },
  checkboxContainer: {
    marginTop: 3, // 3px margin as requested
    alignItems: 'flex-end', // Right justify the checkbox
  },
  checkboxStyle: {
    alignSelf: 'flex-end', // Right align the entire checkbox component
    marginBottom: 0, // Override default margin
    marginRight: 0, // Remove any margin
  },
  checkboxLabelStyle: {
    color: '#333333', // Ensure label is visible with explicit dark gray
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Remote toggle styles
  remoteToggleContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.input_spacing,
  },
  remoteToggleText: {
    color: theme.colors.text.tertiary, // Match checkbox color
    fontSize: 14, // Match checkbox font size
    fontWeight: theme.typography.weights.medium,
  },
  remoteToggleTextPressed: {
    color: theme.colors.primary, // Change to primary color on press
  },
  
  // Bottom padding
  bottomPadding: {
    height: 20,
  },

  // Fixed bottom buttons - matching TitleAndHostsSlider exactly
  modalButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.lg + 20,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInactive: {
    backgroundColor: 'rgba(19, 190, 199, 0.35)',
  },
  saveButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
  saveButtonTextInactive: {
    color: theme.colors.text.secondary,
  },
});

export default LocationSlider; 