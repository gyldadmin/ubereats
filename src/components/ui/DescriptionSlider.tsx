import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import StandardSlider from './StandardSlider';
import { TextArea } from '../../components/inputs/TextArea';
import { theme } from '../../styles/theme';

interface DescriptionSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    description: string;
  }) => Promise<void>;
  initialData?: {
    description?: string;
  };
}

export const DescriptionSlider: React.FC<DescriptionSliderProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      description: initialData?.description || '',
    });
  }, [initialData]);

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    return formData.description !== (initialData?.description || '');
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.description.trim()) {
      errors.push('Description is required');
    }
    
    if (formData.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    await onSave({
      description: formData.description.trim(),
    });
  };

  const handleCancel = () => {
    // Reset to initial data
    setFormData({
      description: initialData?.description || '',
    });
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      description: value,
    }));
  };

  return (
    <StandardSlider
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      onCancel={handleCancel}
      hasUnsavedChanges={hasUnsavedChanges()}
      title="Description"
    >
      <View style={styles.content}>
        <TextArea
          label="Gathering Description"
          value={formData.description}
          onValueChange={handleDescriptionChange}
          placeholder="Describe your gathering's purpose, agenda, and what attendees can expect..."
          maxLength={500}
          required
          showCharacterCount
          numberOfLines={6}
          minHeight={120}
        />
      </View>
    </StandardSlider>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
}); 