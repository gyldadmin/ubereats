import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Animated } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { MultiLineInput } from './inputs';
import { StandardPopup, PopupButton } from './StandardPopup';
import { useGatheringIdeas } from '../../hooks';
import { supabase } from '../../services/supabase';

interface DescriptionData {
  description: string;
}

interface DescriptionSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: DescriptionData;
  onSave: (data: DescriptionData) => Promise<void>;
  experienceTypeId?: string; // For fetching gathering ideas
  experienceTypeLabel?: string; // For popup titles
  gatheringId?: string; // For saving gathering_idea reference
}

export const DescriptionSlider: React.FC<DescriptionSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  experienceTypeId,
  experienceTypeLabel,
  gatheringId,
}) => {
  // Form state
  const [description, setDescription] = useState(initialData?.description || '');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showGatheringIdeasPopup, setShowGatheringIdeasPopup] = useState(false);
  const [showSimpleHelpNote, setShowSimpleHelpNote] = useState(false);
  const [simpleModalMessage, setSimpleModalMessage] = useState('');
  const [popupView, setPopupView] = useState<'intro' | 'list' | 'detail'>('intro');
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [hasInteractedWithPopup, setHasInteractedWithPopup] = useState(false);
  const [showAddInfo, setShowAddInfo] = useState(false);
  
  // Animation for magic wand
  const wandAnim = useRef(new Animated.Value(0)).current;

  // Get gathering ideas using the hook
  const { gatheringIdeas, loading: ideasLoading, hasIdeas } = useGatheringIdeas(experienceTypeId);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🚀 DescriptionSlider opened, initialData:', initialData);
      setDescription(initialData?.description || '');
      setPopupView('intro');
      setSelectedIdea(null);
      setShowAddInfo(false);
    }
  }, [visible, initialData]);

  // Animate magic wand
  useEffect(() => {
    const wandAnimation = () => {
      Animated.sequence([
        Animated.timing(wandAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(wandAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => wandAnimation());
    };

    wandAnimation();
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = description !== (initialData?.description || '');

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      console.log('💾 Saving description data...');
      const dataToSave: DescriptionData = { description };
      
      await onSave(dataToSave);
      console.log('✅ Description data saved successfully');
      onClose();
    } catch (error) {
      console.error('❌ Error saving description data:', error);
      // Keep modal open on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return; // Prevent close during save
    onClose();
  };

  const handleGatheringIdeasLinkPress = () => {
    if (!hasIdeas) {
      // If no ideas, show simple help note modal
      setSimpleModalMessage('Help your guests get closer to each other');
      setShowSimpleHelpNote(true);
      return;
    }
    
    // If has ideas, proceed with normal popup logic
    setHasInteractedWithPopup(true);
    if (hasInteractedWithPopup) {
      // Go directly to list view if user has already seen intro
      setPopupView('list');
    } else {
      // Show intro view first time
      setPopupView('intro');
    }
    setShowGatheringIdeasPopup(true);
  };

  const handleAddIdeaToDescription = async (idea: any) => {
    // a) Add gathering_idea to gatheringDetail.gatheringOther.gathering_idea
    if (gatheringId) {
      try {
        const { error } = await supabase
          .from('gathering_other')
          .update({ gathering_idea: idea.id })
          .eq('gathering', gatheringId);

        if (error) {
          console.error('Error saving gathering idea reference:', error);
        } else {
          console.log('✅ Gathering idea reference saved');
        }
      } catch (error) {
        console.error('Error saving gathering idea reference:', error);
      }
    }

    // b) Hide popup
    setShowGatheringIdeasPopup(false);
    setShowAddInfo(false);

    // c) If description_text is not empty, show simple popup and append text
    if (idea.description_text && idea.description_text.trim()) {
      // Show simple popup with custom message
      setSimpleModalMessage(`We'll add ${idea.label} to your gathering description.`);
      setShowSimpleHelpNote(true);
      
      // Append description_text to the end of description input
      const currentDesc = description.trim();
      const needsCarriageReturn = currentDesc && !currentDesc.endsWith('\n');
      const newDescription = currentDesc + (needsCarriageReturn ? '\n\n' : (currentDesc ? '\n\n' : '')) + idea.description_text;
      setDescription(newDescription);
    }
  };

  // Get popup buttons based on current view
  const getPopupButtons = (): PopupButton[] => {
    switch (popupView) {
      case 'intro':
        return [
          {
            text: 'See How',
            onPress: () => setPopupView('list'),
            style: 'primary'
          }
        ];
      case 'detail':
        return [
          {
            text: 'Back',
            onPress: () => setPopupView('list'),
            style: 'secondary'
          },
          {
            text: selectedIdea?.description_text && selectedIdea.description_text.trim() ? 'Add' : 'Done',
            onPress: () => {
              handleAddIdeaToDescription(selectedIdea);
            },
            style: 'primary'
          }
        ];
      default: // list
        return [];
    }
  };

  // Render popup content based on current view
  const renderPopupContent = () => {
    switch (popupView) {
      case 'intro':
        return (
          <View style={styles.popupIntroContent}>
            <Text style={styles.popupIntroText}>
              Help your guests get closer to each other
            </Text>
          </View>
        );

      case 'list':
        return (
          <View style={styles.popupListContent}>
            <ScrollView style={styles.ideaList}>
              {gatheringIdeas.map((idea) => (
                <TouchableOpacity
                  key={idea.id}
                  style={styles.ideaListItem}
                  onPress={() => {
                    setSelectedIdea(idea);
                    setPopupView('detail');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ideaLabel}>{idea.label}</Text>
                  <FontAwesome5 name="chevron-right" size={16} color="#666" style={styles.chevronIcon} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'detail':
        return (
          <View style={styles.popupDetailContent}>
            <ScrollView>
              <View style={styles.detailSectionWithMargin}>
                <Text style={styles.detailSectionTitle}>About</Text>
                <Text style={styles.detailSectionContent}>{selectedIdea?.overview}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Why It Works</Text>
                <Text style={styles.detailSectionContent}>{selectedIdea?.why}</Text>
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft} />
            <Text style={styles.modalTitle}>Description</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content */}
        <View style={styles.contentContainer}>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.scrollContent}>
            
            {/* Description Input */}
            <MultiLineInput
              label="Description"
              value={description}
              onValueChange={setDescription}
              placeholder="Describe your gathering..."
              numberOfLines={5}
              minHeight={120} // Override for 5 lines (5 x 24px line height)
              maxLength={750}
              showCharacterCount={false}
              required
            />

            {/* Magic Wand Link */}
            <TouchableOpacity 
              style={styles.magicLink}
              onPress={handleGatheringIdeasLinkPress}
            >
              <View style={styles.magicIconContainer}>
                <Animated.View 
                  style={[
                    styles.wandContainer,
                    {
                      transform: [
                        {
                          rotate: wandAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '15deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <FontAwesome5 name="magic" size={20} color="#333333" />
                </Animated.View>
              </View>
              
              <Text style={styles.magicLinkText}>
              {hasInteractedWithPopup ? 'Ideas and Themes' : 'The secret to hosting'}
            </Text>
            </TouchableOpacity>

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

        {/* Simple Help Note Modal - for hasIdeas false case */}
        <Modal
          visible={showSimpleHelpNote}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSimpleHelpNote(false)}
        >
          <TouchableOpacity 
            style={styles.simpleModalOverlay}
            activeOpacity={1}
            onPress={() => setShowSimpleHelpNote(false)}
          >
            <TouchableOpacity 
              style={styles.simpleModalContent}
              activeOpacity={1}
              onPress={() => {}} // Prevent close when tapping content
            >
              <Text style={styles.simpleModalText}>
                {simpleModalMessage}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Gathering Ideas Popup - for hasIdeas true case */}
        {hasIdeas && (
          <StandardPopup
            visible={showGatheringIdeasPopup}
            onClose={() => {
              setShowGatheringIdeasPopup(false);
              setShowAddInfo(false);
            }}
            title={popupView === 'intro' ? '' : 
                  popupView === 'list' ? `${experienceTypeLabel} Ideas` :
                  selectedIdea?.label || 'Idea Detail'}
            buttons={getPopupButtons()}
            height={360}
          >
            {renderPopupContent()}
          </StandardPopup>
        )}

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
  headerLeft: {
    width: 24 + (theme.spacing.sm * 2), // Same width as close button + padding
  },
  modalTitle: {
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

  // Magic Wand Link styles
  magicLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: theme.spacing.input_spacing * 2, // Two input spacings as requested
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  magicIconContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wandContainer: {
    position: 'absolute',
  },
  magicLinkText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.md,
    fontStyle: 'italic',
  },

  // Popup content styles
  popupIntroContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  popupIntroText: {
    fontSize: theme.typography.sizes.xl, // Increased from lg to xl
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28, // Adjusted line height for larger text
  },

  // List view styles
  popupListContent: {
    flex: 1,
  },
  popupListTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  ideaList: {
    flex: 1,
    paddingTop: 8, // Small padding at top
    paddingBottom: 16, // Extra padding at bottom
  },
  ideaListItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12, // More rounded for modern look
    paddingVertical: 18, // More generous vertical padding
    paddingHorizontal: 20, // More generous horizontal padding
    marginBottom: 12, // Consistent spacing
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)', // Very subtle border
  },
  ideaLabel: {
    fontSize: theme.typography.sizes.lg, // Larger, more prominent
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flex: 1, // Take up available space
    lineHeight: 22,
  },
  chevronIcon: {
    opacity: 0.6,
    marginLeft: 12,
  },

  // Detail view styles
  popupDetailContent: {
    flex: 1,
  },
  popupDetailTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailSection: {
    // No bottom margin - spacing handled individually
  },
  detailSectionWithMargin: {
    marginBottom: theme.spacing.lg, // Only for sections that need spacing after
  },
  detailSectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  detailSectionContent: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  addInfo: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  addInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
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

  // Simple modal styles
  simpleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  simpleModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleModalText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
