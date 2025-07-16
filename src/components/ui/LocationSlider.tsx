import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import StandardSlider from './StandardSlider';
import SingleLineInput from './inputs/SingleLineInput';
import { theme } from '../../styles/theme';

interface LocationSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    address: string;
    isRemote: boolean;
  }) => Promise<void>;
  initialData?: {
    address?: string;
    isRemote?: boolean;
  };
}

export const LocationSlider: React.FC<LocationSliderProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    address: initialData?.address || '',
    isRemote: initialData?.isRemote || false,
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      address: initialData?.address || '',
      isRemote: initialData?.isRemote || false,
    });
  }, [initialData]);

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    return (
      formData.address !== (initialData?.address || '') ||
      formData.isRemote !== (initialData?.isRemote || false)
    );
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.isRemote && !formData.address.trim()) {
      errors.push('Address is required for in-person gatherings');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    await onSave({
      address: formData.address.trim(),
      isRemote: formData.isRemote,
    });
  };

  const handleCancel = () => {
    // Reset to initial data
    setFormData({
      address: initialData?.address || '',
      isRemote: initialData?.isRemote || false,
    });
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: value,
    }));
  };

  return (
    <StandardSlider
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      onCancel={handleCancel}
      hasUnsavedChanges={hasUnsavedChanges()}
      title="Location"
    >
      <View style={styles.content}>
        <SingleLineInput
          label="Address"
          value={formData.address}
          onValueChange={handleAddressChange}
          placeholder="Enter gathering address..."
          required={!formData.isRemote}
          disabled={formData.isRemote}
          maxLength={100}
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