import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { SingleLineInput, MultiLineInput } from './inputs';
import { Toggle } from '../inputs';
import PaperDropdown from './PaperDropdown';

interface SettingsData {
  // Attendee cap
  cap: number | null;
  
  // Payment settings
  payment_to_member: boolean;
  payment_for: string | null;
  payment_amount: number | null;
  payment_venmo: string | null;
  
  // Auto-reminders (inverted logic)
  hold_autoreminders: boolean;
  
  // RSVP question
  signup_question: string;
  
  // Plus guests
  plus_guests: number;
  
  // Potluck
  potluck: boolean;
}

interface SettingsSliderProps {
  visible: boolean;
  onClose: () => void;
  initialData?: SettingsData;
  onSave: (data: SettingsData) => Promise<void>;
  onPotluckContribution?: (contribution: string) => Promise<void>;
}

interface PotluckModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (contribution: string) => Promise<void>;
}

const PotluckModal: React.FC<PotluckModalProps> = ({ visible, onClose, onSubmit }) => {
  const [contribution, setContribution] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contribution.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(contribution.trim());
      setContribution('');
      onClose();
    } catch (error) {
      console.error('Error submitting potluck contribution:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.potluckModalOverlay}>
        <View style={styles.potluckModalContainer}>
          <Text style={styles.potluckModalTitle}>What You'll Bring</Text>
          
          <MultiLineInput
            label=""
            value={contribution}
            onValueChange={setContribution}
            placeholder="e.g., Caesar salad, chocolate chip cookies"
            numberOfLines={2}
            style={styles.potluckInput}
            disabled={loading}
          />
          
          <View style={styles.potluckModalButtons}>
            <TouchableOpacity 
              style={styles.potluckCancelButton}
              onPress={() => {
                onClose();
                setContribution('');
              }}
              disabled={loading}
            >
              <Text style={styles.potluckCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.potluckSubmitButton,
                (!contribution.trim() || loading) && styles.potluckSubmitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!contribution.trim() || loading}
            >
              <Text style={styles.potluckSubmitButtonText}>
                {loading ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  onPotluckContribution,
}) => {
  console.log('🏗️ SettingsSlider rendered, visible:', visible);
  console.log('📥 SettingsSlider initialData:', initialData);
  
  // Form state - initialize from props
  const [formData, setFormData] = useState<SettingsData>({
    cap: initialData?.cap || null,
    payment_to_member: initialData?.payment_to_member || false,
    payment_for: initialData?.payment_for || null,
    payment_amount: initialData?.payment_amount || null,
    payment_venmo: initialData?.payment_venmo || null,
    hold_autoreminders: initialData?.hold_autoreminders || false,
    signup_question: initialData?.signup_question || '',
    plus_guests: initialData?.plus_guests || 0,
    potluck: initialData?.potluck || false,
  });
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showPotluckModal, setShowPotluckModal] = useState(false);

  // Independent toggle states - track section expansion separately from form data
  const [toggleStates, setToggleStates] = useState(() => {
    const initialStates = {
      attendeeCap: (initialData?.cap || 0) > 0,
      paymentToMember: initialData?.payment_to_member || false,
      autoReminders: !(initialData?.hold_autoreminders || false), // Inverted logic
      rsvpQuestion: (initialData?.signup_question || '').trim() !== '',
      plusGuests: (initialData?.plus_guests || 0) > 0,
      potluck: initialData?.potluck || false,
    };
    console.log('🔄 Initial toggle states:', initialStates);
    console.log('📝 Form data:', formData);
    return initialStates;
  });

  // Calculate if save button should be enabled
  const hasUnsavedChanges = useMemo(() => {
    if (!initialData) return false;

    // Check for changes in boolean toggles that are saved (Group A)
    const booleanTogglesChanged = 
      formData.payment_to_member !== initialData.payment_to_member ||
      formData.hold_autoreminders !== initialData.hold_autoreminders ||
      formData.potluck !== initialData.potluck;

    // Check for input changes when toggles are ON (Group A)
    const paymentInputsChanged = formData.payment_to_member && (
      formData.payment_for !== (initialData.payment_for || null) ||
      formData.payment_amount !== initialData.payment_amount ||
      formData.payment_venmo !== (initialData.payment_venmo || null)
    );

    // Check for boolean toggles that are NOT saved directly (Group B)
    // FIXED: Only detect changes to FALSE, or changes to inputs when toggle is TRUE
    const initialAttendeeCap = (initialData.cap || 0) > 0;
    const initialRsvpQuestion = (initialData.signup_question || '').trim() !== '';
    const initialPlusGuests = (initialData.plus_guests || 0) > 0;

    const derivedToggleToFalse = 
      (initialAttendeeCap && !toggleStates.attendeeCap) ||
      (initialRsvpQuestion && !toggleStates.rsvpQuestion) ||
      (initialPlusGuests && !toggleStates.plusGuests);

    // Check for input changes when derived toggles are ON (Group B)
    const derivedInputsChanged = 
      (toggleStates.attendeeCap && formData.cap !== initialData.cap) ||
      (toggleStates.rsvpQuestion && formData.signup_question !== (initialData.signup_question || '')) ||
      (toggleStates.plusGuests && formData.plus_guests !== (initialData.plus_guests || 0));

    return booleanTogglesChanged || paymentInputsChanged || derivedToggleToFalse || derivedInputsChanged;
  }, [formData, initialData, toggleStates]);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        cap: initialData.cap || null,
        payment_to_member: initialData.payment_to_member || false,
        payment_for: initialData.payment_for || null,
        payment_amount: initialData.payment_amount || null,
        payment_venmo: initialData.payment_venmo || null,
        hold_autoreminders: initialData.hold_autoreminders || false,
        signup_question: initialData.signup_question || '',
        plus_guests: initialData.plus_guests || 0,
        potluck: initialData.potluck || false,
      });
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    try {
      console.log('💾 Saving settings data...');
      
      // Prepare data with null values for disabled toggles
      const dataToSave: SettingsData = {
        cap: toggleStates.attendeeCap ? formData.cap : null,
        payment_to_member: formData.payment_to_member,
        payment_for: formData.payment_to_member ? formData.payment_for : null,
        payment_amount: formData.payment_to_member ? formData.payment_amount : null,
        payment_venmo: formData.payment_to_member ? formData.payment_venmo : null,
        hold_autoreminders: formData.hold_autoreminders,
        signup_question: toggleStates.rsvpQuestion ? formData.signup_question : '',
        plus_guests: toggleStates.plusGuests ? formData.plus_guests : 0,
        potluck: formData.potluck,
      };

      await onSave(dataToSave);
      console.log('✅ Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  // Handle toggle changes
  const handleToggleChange = (section: string, value: boolean) => {
    console.log(`🔘 Toggle changed: ${section} = ${value}`);
    console.log(`📊 Current toggle state for ${section}:`, toggleStates[section as keyof typeof toggleStates]);
    
    // Update toggle states immediately
    setToggleStates(prev => ({
      ...prev,
      [section]: value,
    }));
    
    // Update form data based on toggle changes
    setFormData(prev => {
      switch (section) {
        case 'attendeeCap':
          // Set reasonable default when toggling ON
          return { ...prev, cap: value ? (prev.cap || 10) : null };
        case 'paymentToMember':
          return { ...prev, payment_to_member: value };
        case 'autoReminders':
          return { ...prev, hold_autoreminders: !value }; // Inverted logic
        case 'rsvpQuestion':
          // Clear field when toggling OFF, preserve when toggling ON
          return { ...prev, signup_question: value ? prev.signup_question : '' };
        case 'plusGuests':
          // Set default guest count when toggling ON
          return { ...prev, plus_guests: value ? (prev.plus_guests || 1) : 0 };
        case 'potluck':
          if (value && !prev.potluck) {
            // Show potluck modal when toggled ON for first time
            setShowPotluckModal(true);
          }
          return { ...prev, potluck: value };
        default:
          return prev;
      }
    });
  };

  // Input change handlers with validation
  const handleCapChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || value.trim() === '') {
      setFormData(prev => ({ ...prev, cap: null }));
    } else if (numValue > 0 && numValue < 1000) {
      setFormData(prev => ({ ...prev, cap: numValue }));
    }
  };

  const handlePaymentAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || value.trim() === '') {
      setFormData(prev => ({ ...prev, payment_amount: null }));
    } else if (numValue < 150) {
      setFormData(prev => ({ ...prev, payment_amount: numValue }));
    } else {
      Alert.alert('Invalid Amount', 'Payment amount must be less than $150');
    }
  };

  // Handle potluck contribution
  const handlePotluckContribution = async (contribution: string) => {
    if (onPotluckContribution) {
      await onPotluckContribution(contribution);
    } else {
      console.log('No potluck contribution handler provided');
    }
  };

  // Plus guests dropdown options
  const plusGuestsOptions = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
  ];

  console.log('🎭 About to render Modal, visible:', visible, 'hasUnsavedChanges:', hasUnsavedChanges);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {console.log('🪟 Inside Modal render')}
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft} />
            <Text style={styles.modalTitle}>Settings</Text>
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
            
            {/* Section 1: Attendee Cap */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Attendee cap</Text>
                <Toggle
                  value={toggleStates.attendeeCap}
                  onValueChange={(value) => {
                    console.log('👆 AttendeeeCap toggle tapped, current value:', toggleStates.attendeeCap, 'new value:', value);
                    handleToggleChange('attendeeCap', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
              
              {toggleStates.attendeeCap && (
                <View style={styles.inputContainer}>
                  <SingleLineInput
                    label="Cap"
                    value={formData.cap?.toString() || ''}
                    onValueChange={handleCapChange}
                    keyboardType="numeric"
                    placeholder="Enter number"
                    style={styles.inputOverride}
                  />
                </View>
              )}
            </View>

            {/* Section 2: Receive Payments from Guests */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Receive payments from guests</Text>
                <Toggle
                  value={toggleStates.paymentToMember}
                  onValueChange={(value) => {
                    console.log('👆 PaymentToMember toggle tapped, current value:', toggleStates.paymentToMember, 'new value:', value);
                    handleToggleChange('paymentToMember', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
              
              {toggleStates.paymentToMember && (
                <>
                  <View style={styles.inputContainer}>
                    <SingleLineInput
                      label="Payment For"
                      value={formData.payment_for || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_for: value || null }))}
                      placeholder="What is this payment for?"
                      style={styles.inputOverride}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <SingleLineInput
                      label="Payment Amount"
                      value={formData.payment_amount?.toString() || ''}
                      onValueChange={handlePaymentAmountChange}
                      keyboardType="numeric"
                      placeholder="Amount"
                      style={styles.inputOverride}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <SingleLineInput
                      label="Venmo Address"
                      value={formData.payment_venmo || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_venmo: value || null }))}
                      placeholder="@username"
                      style={styles.inputOverride}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Section 3: Auto-reminders */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Auto-reminders</Text>
                <Toggle
                  value={toggleStates.autoReminders}
                  onValueChange={(value) => {
                    console.log('👆 AutoReminders toggle tapped, current value:', toggleStates.autoReminders, 'new value:', value);
                    handleToggleChange('autoReminders', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
            </View>

            {/* Section 4: Add Question to RSVP */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add question to RSVP</Text>
                <Toggle
                  value={toggleStates.rsvpQuestion}
                  onValueChange={(value) => {
                    console.log('👆 RsvpQuestion toggle tapped, current value:', toggleStates.rsvpQuestion, 'new value:', value);
                    handleToggleChange('rsvpQuestion', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
              
              {toggleStates.rsvpQuestion && (
                <View style={styles.inputContainer}>
                  <MultiLineInput
                    label="Question"
                    value={formData.signup_question}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, signup_question: value }))}
                    numberOfLines={2}
                    placeholder="Enter your RSVP question"
                    style={styles.inputOverride}
                  />
                </View>
              )}
            </View>

            {/* Section 5: Guests Can Bring Others */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Guests can bring others</Text>
                <Toggle
                  value={toggleStates.plusGuests}
                  onValueChange={(value) => {
                    console.log('👆 PlusGuests toggle tapped, current value:', toggleStates.plusGuests, 'new value:', value);
                    handleToggleChange('plusGuests', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
              
              {toggleStates.plusGuests && (
                <View style={styles.inputContainer}>
                  <PaperDropdown
                    label="Plus Guests"
                    value={formData.plus_guests || 1}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plus_guests: value as number }))}
                    options={plusGuestsOptions}
                    style={styles.inputOverride}
                  />
                </View>
              )}
            </View>

            {/* Section 6: Potluck Meal */}
            <View style={[styles.sectionContainer, styles.lastSection]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Potluck meal</Text>
                <Toggle
                  value={toggleStates.potluck}
                  onValueChange={(value) => {
                    console.log('👆 Potluck toggle tapped, current value:', toggleStates.potluck, 'new value:', value);
                    handleToggleChange('potluck', value);
                  }}
                  style={styles.toggleOverride}
                />
              </View>
            </View>

          </ScrollView>
        </View>

        {/* Fixed Bottom Buttons */}
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

        {/* Potluck Modal */}
        <PotluckModal
          visible={showPotluckModal}
          onClose={() => setShowPotluckModal(false)}
          onSubmit={handlePotluckContribution}
        />

      </View>
    </Modal>
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
  headerLeft: {
    width: 24 + (theme.spacing.sm * 2),
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
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 120, // Space for floating buttons
    paddingHorizontal: 0, // Sections handle their own padding
  },

  // Section styles with exact spacing requirements
  sectionContainer: {
    paddingVertical: 20, // Exactly 20px top and bottom
    paddingHorizontal: theme.spacing.lg, // Standard horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    // Ensure stable positioning during expansion
    position: 'relative',
  },
  lastSection: {
    borderBottomWidth: 0, // No bottom border on last section
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0, // Flush with container's top padding
    marginBottom: 0, // No bottom margin
    minHeight: 24, // Ensure consistent height for alignment
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 24, // Match minHeight for perfect alignment
    // Ensure consistent text baseline
    textAlignVertical: 'center',
    includeFontPadding: false, // Remove extra font padding that could cause misalignment
  },

  // Input container with exact spacing - full width inputs
  inputContainer: {
    marginTop: 20, // Exactly 20px from title/toggle row
    marginBottom: 0, // No bottom margin
    width: '100%', // Full width for normal inputs
    // Ensure input container doesn't affect toggle positioning
    position: 'relative',
  },

  // Input container for compact/right-aligned inputs
  inputContainerCompact: {
    marginTop: 20, // Exactly 20px from title/toggle row
    marginBottom: 0, // No bottom margin
    alignItems: 'flex-end', // Right-align narrow inputs
    // Ensure input container doesn't affect toggle positioning
    position: 'relative',
  },

  // Input overrides to prevent compound spacing
  inputOverride: {
    marginTop: 0, // Container handles the margin
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  toggleOverride: {
    margin: 0, // Reset any default margins
    marginBottom: 0, // Specifically override Toggle component's default marginBottom
    marginTop: 0, // Ensure no top margin
    alignSelf: 'center', // Ensure toggle is vertically centered
    // Override the Toggle component's container style completely
    height: 24, // Match sectionTitle lineHeight
    justifyContent: 'center',
  },

  // Compact inputs (80px width, right-aligned)
  compactInput: {
    width: 80,
    alignSelf: 'flex-end', // Right-align
  },

  // Fixed bottom buttons
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

  // Potluck Modal styles (reused from EventDetailScreen)
  potluckModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  potluckModalContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  potluckModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  potluckInput: {
    marginBottom: theme.spacing.lg,
  },
  potluckModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  potluckCancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  potluckCancelButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  potluckSubmitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  potluckSubmitButtonDisabled: {
    backgroundColor: theme.colors.text.tertiary,
  },
  potluckSubmitButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.inverse,
  },
}); 