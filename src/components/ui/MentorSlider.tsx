import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { MultiSelect } from './inputs';
import { SearchableDropdown } from './SearchableDropdown';
import { StandardPopup, PopupButton } from './StandardPopup';
import { SingleLineInput } from './inputs';
import { useActiveMentors, useLearningTopics } from '../../hooks';
import { supabase } from '../../services/supabase';

interface MentorData {
  mentors: string[]; // Array of mentor IDs  
  learningTopic?: string; // Learning topic ID
}

interface MentorSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: MentorData;
  onSave: (data: MentorData) => Promise<void>;
  experienceType?: string; // For conditional visibility of About link
}

export const MentorSlider: React.FC<MentorSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  experienceType,
}) => {
  // Form state
  const [mentors, setMentors] = useState<string[]>(initialData?.mentors || []);
  const [learningTopic, setLearningTopic] = useState(initialData?.learningTopic || '');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showTopicInfo, setShowTopicInfo] = useState(false);
  
  // Propose New Mentor state
  const [proposeView, setProposeView] = useState<'form' | 'success'>('form');
  const [proposeMentorData, setProposeMentorData] = useState({
    name: '',
    title: '',
    employer: ''
  });
  const [proposeSaving, setProposeSaving] = useState(false);

  // Get data using existing hooks
  const { mentors: activeMentors, loading: mentorsLoading, error: mentorsError } = useActiveMentors();
  const { learningTopics, loading: topicsLoading, error: topicsError } = useLearningTopics();

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      console.log('🚀 MentorSlider opened, initialData:', initialData);
      setMentors(initialData?.mentors || []);
      setLearningTopic(initialData?.learningTopic || '');
      
      // Auto-populate topic from first mentor if no topic is set and mentors exist
      if (!initialData?.learningTopic && initialData?.mentors && initialData.mentors.length > 0) {
        // Find the first mentor's learning topic
        const firstMentorId = initialData.mentors[0];
        const firstMentor = activeMentors.find(m => m.id === firstMentorId);
        
        // TODO: This requires adding a learning_topic field to mentor_satellites table
        // The mentor_satellites currently has: full_name, title, bio, tagline, employer_temp
        // To implement this feature, we would need to add learning_topic UUID field to mentor_satellites
        // For now, leave empty and user will manually select topic
        console.log('💡 Auto-populate topic from mentor requires learning_topic field in mentor_satellites:', firstMentor);
      }
    }
  }, [visible, initialData, activeMentors]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = 
    JSON.stringify(mentors.sort()) !== JSON.stringify((initialData?.mentors || []).sort()) ||
    learningTopic !== (initialData?.learningTopic || '');

  // Transform active mentors to dropdown options (max 3)
  const mentorOptions = activeMentors.map(mentor => ({
    value: mentor.id,
    label: mentor.full_name || 'Unknown Mentor'
  }));

  // Transform learning topics to dropdown options
  const topicOptions = learningTopics.map(topic => ({
    value: topic.id,
    label: topic.label
  }));

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      console.log('💾 Saving mentor data...');
      const dataToSave: MentorData = {
        mentors,
        learningTopic: learningTopic || undefined
      };
      
      await onSave(dataToSave);
      console.log('✅ Mentor data saved successfully');
      onClose();
    } catch (error) {
      console.error('❌ Error saving mentor data:', error);
      // Keep modal open on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return; // Prevent close during save
    onClose();
  };

  // Propose New Mentor handlers
  const handleProposeMentorOpen = () => {
    setProposeView('form');
    setProposeMentorData({ name: '', title: '', employer: '' });
    setShowProposeModal(true);
  };

  const handleProposeMentorClose = () => {
    setShowProposeModal(false);
    setProposeView('form');
    setProposeMentorData({ name: '', title: '', employer: '' });
  };

  const handleProposeMentorSave = async () => {
    if (!proposeMentorData.name.trim()) return;

    setProposeSaving(true);
    try {
      console.log('💾 Creating new mentor proposal...');
      
      // Get current user for proposed_by field
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User authentication required to propose mentor');
      }
      
      // Extract first name from full name (everything before first space)
      const firstName = proposeMentorData.name.trim().split(' ')[0];
      
      // Get the required status and approval IDs first
      const [statusResult, approvalResult] = await Promise.all([
        supabase.from('mentor_status').select('id').eq('label', 'Candidate').single(),
        supabase.from('mentor_approval').select('id').eq('label', 'Needs Approval').single()
      ]);

      if (statusResult.error || approvalResult.error) {
        throw new Error('Failed to fetch mentor status/approval options');
      }

      // Create the mentor record (no user_id needed - mentors don't need to be users)
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .insert({
          mentor_status: statusResult.data.id,
          mentor_approval: approvalResult.data.id,
        })
        .select()
        .single();

      if (mentorError) throw mentorError;

      // Create the mentor satellite record with the display data
      const { error: satelliteError } = await supabase
        .from('mentor_satellites')
        .insert({
          mentor_id: mentorData.id,
          full_name: proposeMentorData.name.trim(),
          first: firstName,
          title: proposeMentorData.title.trim() || null,
          employer_temp: proposeMentorData.employer.trim() || null,
          proposed_by: user.id
        });

      if (satelliteError) throw satelliteError;

      console.log('✅ Mentor proposal created successfully');
      setProposeView('success');
    } catch (error) {
      console.error('❌ Error creating mentor proposal:', error);
    } finally {
      setProposeSaving(false);
    }
  };

  // Get buttons for Propose New Mentor modal
  const getProposeButtons = (): PopupButton[] => {
    if (proposeView === 'form') {
      return [
        {
          text: 'Cancel',
          onPress: handleProposeMentorClose,
          style: 'secondary'
        },
        {
          text: proposeSaving ? 'Proposing...' : 'Propose',
          onPress: handleProposeMentorSave,
          style: 'primary',
          disabled: proposeSaving || !proposeMentorData.name.trim()
        }
      ];
    } else {
      return [
        {
          text: 'Done',
          onPress: handleProposeMentorClose,
          style: 'primary'
        }
      ];
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
            {experienceType === 'Mentoring' ? (
              <TouchableOpacity 
                style={styles.headerInfoButton}
                onPress={() => setShowTopicInfo(true)}
              >
                <Feather name="info" size={19} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerLeft} />
            )}
            <Text style={styles.modalTitle}>Mentor</Text>
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
            
            {/* Mentor Selection Group */}
            <View style={styles.inputGroup}>
              <MultiSelect
                title="Select Mentors"
                label="Mentor"
                options={mentorOptions}
                selectedValues={mentors}
                onSelectionChange={setMentors}
                placeholder="Select mentors (max 3)"
                maxSelections={3}
                required
              />

              {/* Propose New Mentor Link */}
              <TouchableOpacity 
                style={styles.proposeLink}
                onPress={handleProposeMentorOpen}
              >
                <Text style={styles.proposeLinkText}>Propose New</Text>
              </TouchableOpacity>
            </View>

            {/* Topic Selection */}
            <SearchableDropdown
              label="Topic"
              options={topicOptions}
              value={learningTopic}
              onValueChange={setLearningTopic}
              placeholder="Select learning topic (optional)"
            />

            {/* Loading states */}
            {(mentorsLoading || topicsLoading) && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Loading {mentorsLoading ? 'mentors' : 'topics'}...
                </Text>
              </View>
            )}

            {/* Error states */}
            {(mentorsError || topicsError) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {mentorsError || topicsError}
              </Text>
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

        {/* Topic Info Modal */}
        {showTopicInfo && (
          <Modal
            visible={showTopicInfo}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTopicInfo(false)}
          >
            <TouchableOpacity 
              style={styles.overlayContainer}
              onPress={() => setShowTopicInfo(false)}
            >
              <View style={styles.infoModal}>
                <Text style={styles.infoModalText}>
                  Mentors need to be pre-approved by your gyld. If you don't see your mentor listed, please click "Propose New", fill out the form, and we'll get back to you with an approval decision within a day.{'\n\n'}The topic you choose will be used to determine the Rep that participants receive.
                </Text>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Propose New Mentor Modal */}
        <StandardPopup
          visible={showProposeModal}
          onClose={handleProposeMentorClose}
          title={proposeView === 'form' ? "Propose New Mentor" : "Proposal Received"}
          buttons={getProposeButtons()}
          height={340}
        >
          {proposeView === 'form' ? (
            <View style={styles.proposeForm}>
              <SingleLineInput
                label="Name"
                value={proposeMentorData.name}
                onValueChange={(value) => setProposeMentorData(prev => ({ ...prev, name: value }))}
                placeholder="Enter mentor's full name"
                required
              />
              
              <SingleLineInput
                label="Title"
                value={proposeMentorData.title}
                onValueChange={(value) => setProposeMentorData(prev => ({ ...prev, title: value }))}
                placeholder="Enter mentor's title"
              />
              
              <SingleLineInput
                label="Employer"
                value={proposeMentorData.employer}
                onValueChange={(value) => setProposeMentorData(prev => ({ ...prev, employer: value }))}
                placeholder="Enter mentor's employer"
              />
            </View>
          ) : (
            <View style={styles.proposeSuccess}>
              <Text style={styles.proposeSuccessText}>
                We'll get back to you within a day to confirmed your proposed mentor has been approved.
              </Text>
            </View>
          )}
        </StandardPopup>

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

  // Mentor-specific styles
  proposeLink: {
    alignSelf: 'flex-end', // Right alignment (flush with right edge)
    marginTop: 6, // 6px below mentor input
    marginBottom: theme.spacing.sm,
  },
  proposeLinkText: {
    color: theme.colors.text.tertiary, // Light gray like other links
    fontSize: 14,
    fontWeight: '500',
  },
  headerInfoButton: {
    padding: theme.spacing.sm,
  },

  // Loading and error states - matching TitleAndHostsSlider
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

  // Topic info modal
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoModal: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    alignItems: 'center',
    maxWidth: 280,
  },
  infoModalText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
    textAlign: 'left',
    lineHeight: 20,
  },

  // Propose New Mentor modal styles
  proposeForm: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.lg, // Add spacing between inputs
    marginBottom: theme.spacing.lg, // Increase margin above button row for better separation
  },
  proposeSuccess: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.lg, // Increase margin above button row to match proposeForm
    alignItems: 'center',
  },
  proposeSuccessText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 