import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import StandardSlider from './StandardSlider';
import EventDateTimePicker from './EventDateTimePicker';
import { theme } from '../../styles/theme';

interface DateTimeSliderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    startTime: Date;
    endTime: Date;
  }) => Promise<void>;
  initialData?: {
    startTime?: Date;
    endTime?: Date;
  };
}

export const DateTimeSlider: React.FC<DateTimeSliderProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  // Set default times: start time is now, end time is 2 hours later
  const defaultStartTime = new Date();
  const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000);

  const [formData, setFormData] = useState({
    startTime: initialData?.startTime || defaultStartTime,
    endTime: initialData?.endTime || defaultEndTime,
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      startTime: initialData?.startTime || defaultStartTime,
      endTime: initialData?.endTime || defaultEndTime,
    });
  }, [initialData]);

  // Check if current data has unsaved changes
  const hasUnsavedChanges = () => {
    const initialStart = initialData?.startTime || defaultStartTime;
    const initialEnd = initialData?.endTime || defaultEndTime;
    
    return (
      formData.startTime.getTime() !== initialStart.getTime() ||
      formData.endTime.getTime() !== initialEnd.getTime()
    );
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.startTime) {
      errors.push('Start time is required');
    }
    
    if (!formData.endTime) {
      errors.push('End time is required');
    }
    
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      errors.push('End time must be after start time');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    await onSave({
      startTime: formData.startTime,
      endTime: formData.endTime,
    });
  };

  const handleCancel = () => {
    // Reset to initial data
    setFormData({
      startTime: initialData?.startTime || defaultStartTime,
      endTime: initialData?.endTime || defaultEndTime,
    });
  };

  const handleStartTimeChange = (date: Date) => {
    setFormData(prev => ({
      ...prev,
      startTime: date,
    }));
  };

  const handleEndTimeChange = (date: Date) => {
    setFormData(prev => ({
      ...prev,
      endTime: date,
    }));
  };

  return (
    <StandardSlider
      visible={visible}
      onClose={onClose}
      onSave={handleSave}
      onCancel={handleCancel}
      hasUnsavedChanges={hasUnsavedChanges()}
      title="Date & Time"
    >
      <View style={styles.content}>
        <EventDateTimePicker
          label="Event Date & Time"
          startTime={formData.startTime}
          endTime={formData.endTime}
          onStartTimeChange={handleStartTimeChange}
          onEndTimeChange={handleEndTimeChange}
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