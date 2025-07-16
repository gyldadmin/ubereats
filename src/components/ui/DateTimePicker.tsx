import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';

interface DateTimePickerProps {
  label: string;
  value: Date | undefined;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'datetime' | 'date' | 'time';
  error?: boolean;
  disabled?: boolean;
}

export default function DateTimePickerComponent({
  label,
  value,
  onValueChange,
  placeholder = 'Select date & time',
  minimumDate,
  maximumDate,
  mode = 'datetime',
  error = false,
  disabled = false,
}: DateTimePickerProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');

  // Format date segment
  const formatDateSegment = (date: Date | undefined) => {
    if (!date) return 'Select date';
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time segment
  const formatTimeSegment = (date: Date | undefined) => {
    if (!date) return 'Select time';
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleTimeString('en-US', options);
  };

  // Handle press for different modes
  const handlePress = (segmentMode?: 'date' | 'time') => {
    if (disabled) return;
    
    const modeToUse = segmentMode || (mode === 'datetime' ? 'date' : mode);
    
    if (Platform.OS === 'android') {
      // Use imperative API on Android
      DateTimePickerAndroid.open({
        value: value || new Date(),
        onChange: handleConfirm,
        mode: modeToUse,
        is24Hour: true,
        minimumDate,
        maximumDate,
      });
    } else {
      // Use component API on iOS
      setCurrentMode(modeToUse);
      setPickerVisible(true);
    }
  };

  // Handle date/time confirmation
  const handleConfirm = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === 'ios') {
      setPickerVisible(false);
    }
    
    if (selectedDate) {
      onValueChange(selectedDate);
    }
  };

  // Handle iOS cancel
  const handleCancel = () => {
    setPickerVisible(false);
  };

  // Render date/time segments
  const renderSegments = () => {
    if (mode === 'date') {
      return (
        <TouchableOpacity 
          style={[styles.segment, error && styles.segmentError]} 
          onPress={() => handlePress('date')}
          disabled={disabled}
        >
          <Text style={[styles.segmentText, disabled && styles.segmentTextDisabled]}>
            {value ? formatDateSegment(value) : placeholder}
          </Text>
        </TouchableOpacity>
      );
    }
    
    if (mode === 'time') {
      return (
        <TouchableOpacity 
          style={[styles.segment, error && styles.segmentError]} 
          onPress={() => handlePress('time')}
          disabled={disabled}
        >
          <Text style={[styles.segmentText, disabled && styles.segmentTextDisabled]}>
            {value ? formatTimeSegment(value) : placeholder}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // datetime mode - show both segments
    return (
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segment, styles.segmentLeft, error && styles.segmentError]} 
          onPress={() => handlePress('date')}
          disabled={disabled}
        >
          <Text style={[styles.segmentText, disabled && styles.segmentTextDisabled]}>
            {formatDateSegment(value)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.segment, styles.segmentRight, error && styles.segmentError]} 
          onPress={() => handlePress('time')}
          disabled={disabled}
        >
          <Text style={[styles.segmentText, disabled && styles.segmentTextDisabled]}>
            {formatTimeSegment(value)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      <View style={[styles.inputContainer, error && styles.inputContainerError, disabled && styles.inputContainerDisabled]}>
        {renderSegments()}
      </View>
      
      {/* iOS native picker */}
      {isPickerVisible && Platform.OS === 'ios' && (
        <DateTimePicker
          value={value || new Date()}
          mode={currentMode}
          display="default"
          onChange={handleConfirm}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
    color: theme.colors.error,
  },
  inputContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.background.disabled,
    opacity: 0.6,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  segment: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flex: 1,
    alignItems: 'center',
  },
  segmentLeft: {
    marginRight: theme.spacing.xs / 2,
  },
  segmentRight: {
    marginLeft: theme.spacing.xs / 2,
  },
  segmentError: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: theme.typography.styles.body.fontSize,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  segmentTextDisabled: {
    color: theme.colors.text.disabled,
  },
}); 