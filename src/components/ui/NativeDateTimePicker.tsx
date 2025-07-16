import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import { BRAND_COLOR } from '../../constants/theme';

interface NativeDateTimePickerProps {
  label: string;
  value: Date;
  onValueChange: (date: Date) => void;
  mode?: 'datetime' | 'date' | 'time';
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: boolean;
}

export default function NativeDateTimePicker({
  label,
  value,
  onValueChange,
  mode = 'datetime',
  minuteInterval = 15,
  minimumDate,
  maximumDate,
  disabled = false,
  error = false,
}: NativeDateTimePickerProps) {
  
  // Handle date/time change
  const handleChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onValueChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      <View style={[
        styles.pickerContainer,
        error && styles.pickerContainerError,
        disabled && styles.pickerContainerDisabled
      ]}>
        <DateTimePicker
          value={value}
          mode={mode}
          accentColor={BRAND_COLOR}
          minuteInterval={minuteInterval}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.styles.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  labelError: {
    color: theme.colors.status.error,
  },
  pickerContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  pickerContainerError: {
    borderColor: theme.colors.status.error,
  },
  pickerContainerDisabled: {
    backgroundColor: theme.colors.background.disabled,
    opacity: 0.6,
  },
}); 