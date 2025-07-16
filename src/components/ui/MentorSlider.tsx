import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import StandardSlider from './StandardSlider';
import { MultiSelect } from './AdvancedMultiSelect';
import { theme } from '../../styles/theme';

interface MentorSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    mentorIds: string[];
  }) => Promise<void>;
  initialData?: {
    mentorIds?: string[];
  };
  mentorOptions?: Array<{
    value: string;
    label: string;
    expertise?: string;
  }>;
}

export const MentorSlider: React.FC<MentorSliderProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
  mentorOptions = [],
}) => {
  const [formData, setFormData] = useState({
    mentorIds: initialData?.mentorIds || [],
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      mentorIds: initialData?.mentorIds || [],
    });
  }, [initialData]);

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    const currentIds = formData.mentorIds.sort();
    const initialIds = (initialData?.mentorIds || []).sort();
    return JSON.stringify(currentIds) !== JSON.stringify(initialIds);
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (formData.mentorIds.length === 0) {
      errors.push('Please select at least one mentor for your gathering');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    await onSave({
      mentorIds: formData.mentorIds,
    });
  };

  const handleCancel = () => {
    // Reset to initial data
    setFormData({
      mentorIds: initialData?.mentorIds || [],
    });
  };

  const handleMentorChange = (selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      mentorIds: selectedIds,
    }));
  };

  // Get selected mentors for display
  const selectedMentors = mentorOptions.filter(mentor => 
    formData.mentorIds.includes(mentor.value)
  );

  return (
    <StandardSlider
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      onCancel={handleCancel}
      hasUnsavedChanges={hasUnsavedChanges()}
      title="Mentor"
    >
      <View style={styles.content}>
        <MultiSelect
          title="Select Mentors"
          options={mentorOptions}
          selectedValues={formData.mentorIds}
          onSelectionChange={handleMentorChange}
          placeholder="Choose mentors for your gathering..."
          disabled={mentorOptions.length === 0}
        />
        
        {selectedMentors.length > 0 && (
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorInfoLabel}>Selected Mentors:</Text>
            {selectedMentors.map((mentor, index) => (
              <Text key={mentor.value} style={styles.mentorInfoText}>
                {mentor.label}
                {mentor.expertise && ` - ${mentor.expertise}`}
              </Text>
            ))}
          </View>
        )}
        
        {mentorOptions.length === 0 && (
          <Text style={styles.warningText}>
            No available mentors found. Please check with your Gyld administrator.
          </Text>
        )}
      </View>
    </StandardSlider>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  mentorInfo: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  mentorInfoLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  mentorInfoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
  warningText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.status?.warning || '#f39c12',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
}); 