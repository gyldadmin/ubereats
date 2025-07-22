import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { SingleLineInput, MultiSelect } from './inputs';
import { SearchableDropdown } from './SearchableDropdown';
import { ImageUpload } from './ImageUpload';
import { useGyldMembers } from '../../hooks/useGyldMembers';

interface TitleHostsData {
  title: string;
  scribe?: string; // User ID of selected scribe
  hosts: string[]; // Array of user IDs
  image?: string; // Image URL
}

interface TitleAndHostsSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: TitleHostsData;
  onSave: (data: TitleHostsData) => Promise<void>;
  experienceType?: string; // To determine if scribe field should be visible
}

export const TitleAndHostsSlider: React.FC<TitleAndHostsSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  experienceType,
}) => {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [scribe, setScribe] = useState(initialData?.scribe || '');
  const [hosts, setHosts] = useState<string[]>(initialData?.hosts || []);
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showHosts, setShowHosts] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [userHasPressedAddHosts, setUserHasPressedAddHosts] = useState(false);
  const [userHasPressedAddImage, setUserHasPressedAddImage] = useState(false);
  const [showSaveChangesPopup, setShowSaveChangesPopup] = useState(false);

  // Get gyld members for dropdowns
  const { members: gyldMembers, loading: membersLoading, error: membersError } = useGyldMembers();

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🚀 TitleAndHostsSlider opened, initialData:', initialData);
      setTitle(initialData?.title || '');
      setScribe(initialData?.scribe || '');
      setHosts(initialData?.hosts || []);
      setImage(initialData?.image || null);
      
      // Set button pressed states based on existing data
      // Only set userHasPressedAddHosts to true if there are multiple hosts (>1)
      setUserHasPressedAddHosts((initialData?.hosts?.length || 0) > 1);
      setUserHasPressedAddImage(!!initialData?.image);
      
      // Let the computed logic handle visibility automatically
    }
  }, [visible, initialData]);

  // Check if scribe field should be visible (only for Mentoring experience type)
  const shouldShowScribe = experienceType?.toLowerCase() === 'mentoring';

  // Computed visibility logic
  const shouldShowHosts = hosts.length > 1 || userHasPressedAddHosts;
  const shouldShowImage = (image !== null && image !== '') || userHasPressedAddImage;

  // Update showHosts and showImage based on computed logic
  React.useEffect(() => {
    setShowHosts(shouldShowHosts);
    setShowImage(shouldShowImage);
  }, [shouldShowHosts, shouldShowImage]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = 
    title !== (initialData?.title || '') ||
    scribe !== (initialData?.scribe || '') ||
    JSON.stringify(hosts.sort()) !== JSON.stringify((initialData?.hosts || []).sort()) ||
    image !== (initialData?.image || null);

  // No validation required - save button only checks for changes

  // Transform gyld members to dropdown options
  const memberOptions = gyldMembers.map(member => ({
    value: member.user_id,
    label: member.full_name || `${member.first} ${member.last}`.trim() || 'Unknown Member'
  }));

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      console.log('💾 Saving title and hosts data...');
      const dataToSave: TitleHostsData = {
        title: title.trim(),
        hosts,
        ...(shouldShowScribe && { scribe }),
        ...(image && { image })
      };
      
      await onSave(dataToSave);
      console.log('✅ Save completed, closing modal');
      onClose();
    } catch (error) {
      console.error('❌ Error saving title and hosts:', error);
      // Could add error state/toast here
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 TitleAndHostsSlider handleClose called');
    if (hasUnsavedChanges) {
      setShowSaveChangesPopup(true);
    } else {
      onClose();
    }
  };

  // Handle save changes popup responses
  const handleSaveChanges = async () => {
    await handleSave();
    setShowSaveChangesPopup(false);
  };

  const handleDiscardChanges = () => {
    setShowSaveChangesPopup(false);
    onClose();
  };

  // Handle showing hosts section
  const handleShowHosts = () => {
    console.log('👥 Showing hosts section');
    setUserHasPressedAddHosts(true);
  };

  // Handle showing image section  
  const handleShowImage = () => {
    console.log('🖼️ Showing image section');
    setUserHasPressedAddImage(true);
  };

  // Render the toggle links for hidden sections
  const renderToggleLinks = () => {
    const hostsHidden = !shouldShowHosts;
    const imageHidden = !shouldShowImage;
    
    // If both are visible, no button needed
    if (!hostsHidden && !imageHidden) {
      return null;
    }
    
    const links = [];
    
    if (hostsHidden) {
      links.push({
        text: 'Add Co-Hosts',
        onPress: handleShowHosts,
      });
    }
    
    if (imageHidden) {
      links.push({
        text: 'Add Image',
        onPress: handleShowImage,
      });
    }

    return (
      <View style={styles.toggleLinksContainer}>
        {links.map((link, index) => (
          <TouchableOpacity
            key={link.text}
            onPress={link.onPress}
            style={styles.toggleLink}
          >
            <Text style={styles.toggleLinkText}>
              {link.text}
              {index < links.length - 1 && ' • '}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  console.log('🎨 TitleAndHostsSlider rendering...');

  return (
    <>
      <Modal 
        visible={visible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
      <View style={styles.modalContainer}>
        {/* Header with X button and centered title */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            {/* Left spacer to balance the X button */}
            <View style={styles.headerSpacer} />
            
            {/* Centered title */}
            <Text style={styles.headerTitle}>Title & Hosts</Text>
            
            {/* X button */}
            <TouchableOpacity 
              onPress={handleClose}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content with scrolling capability */}
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Gathering Title - Always visible */}
            <SingleLineInput
              label="Gathering Title"
              value={title}
              onValueChange={setTitle}
              placeholder="Enter gathering title"
              maxLength={32}
              required
            />

            {/* Scribe - Only visible for Mentoring */}
            {shouldShowScribe && (
              <SearchableDropdown
                label="Scribe (records knowledge)"
                options={memberOptions}
                value={scribe}
                onValueChange={setScribe}
                placeholder="Select a scribe (optional)"
              />
            )}

            {/* Hosts - Progressive disclosure */}
            {showHosts && (
              <MultiSelect
                title="Select Co-Hosts"
                label="Hosts"
                options={memberOptions}
                selectedValues={hosts}
                onSelectionChange={setHosts}
                placeholder="Select hosts"
              />
            )}

            {/* Image Upload - Progressive disclosure */}
            {showImage && (
                          <ImageUpload
              label="Gathering Image"
              value={image}
              onValueChange={(url) => setImage(url)}
              placeholder="Gathering Image"
            />
            )}

            {/* Toggle links for hidden sections */}
            {renderToggleLinks()}

            {/* Loading states */}
            {membersLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading members...</Text>
              </View>
            )}

            {/* Error states */}
            {membersError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{membersError}</Text>
              </View>
            )}

            {/* Extra padding at bottom for floating buttons */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>

        {/* Fixed bottom buttons - floating over scrolling content */}
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              !hasUnsavedChanges && styles.saveButtonInactive
            ]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            <Text style={[
              styles.saveButtonText,
              !hasUnsavedChanges && styles.saveButtonTextInactive
            ]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Save Changes Popup */}
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
          <Text style={styles.popupTitle}>Save Changes to Title and Hosts?</Text>
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
   </>
 );
};

const styles = StyleSheet.create({
  // Modal styles - matching other sliders
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
    paddingBottom: 120, // Extra space for floating buttons
    gap: theme.spacing.input_spacing, // 54px spacing between all elements
  },

  // Toggle links for progressive disclosure
  toggleLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  toggleLink: {
    // No additional styling needed, touchable area
  },
  toggleLinkText: {
    color: theme.colors.text.tertiary, // Light gray like More button
    fontSize: 14,
    fontWeight: '500',
  },

  // Loading and error states
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.status?.error || '#d32f2f',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },

  // Fixed bottom buttons - floating over scrolling content
  modalButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg + 20,
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

  // Save Changes Popup Styles
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
    marginBottom: theme.spacing.lg,
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