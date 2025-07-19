import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

interface TimePickerInputProps {
  // Core functionality
  label: string;
  value: { hours: number; minutes: number } | undefined;
  onValueChange: (time: { hours: number; minutes: number } | undefined) => void;
  placeholder?: string;
  
  // Time configuration
  is24Hour?: boolean;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  
  // Display format
  timeFormat?: string;
  
  // Validation & states
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // Appearance
  inputMode?: 'outlined' | 'flat';
  dense?: boolean;
  
  // Colors & theming
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  
  // Icons
  clockIcon?: string;
  clearIcon?: string;
  showClockIcon?: boolean;
  showClearIcon?: boolean;
  
  // Events
  onFocus?: () => void;
  onBlur?: () => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Styling
  style?: any;
  contentStyle?: any;
  
  // Testing
  testID?: string;
}

export default function TimePickerInput({
  label,
  value,
  onValueChange,
  placeholder = 'Select time',
  is24Hour = false,
  minuteInterval = 1,
  error = false,
  disabled = false,
  required,
  inputMode = 'outlined',
  dense = false,
  textColor,
  backgroundColor,
  outlineColor,
  activeOutlineColor,
  clockIcon = 'clock',
  clearIcon = 'x',
  showClockIcon = true,
  showClearIcon = true,
  onFocus,
  onBlur,
  onModalOpen,
  onModalClose,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
  testID,
}: TimePickerInputProps) {
  const paperTheme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Convert time object to Date for picker
  const timeToDate = (time: { hours: number; minutes: number } | undefined) => {
    if (!time) return new Date();
    const date = new Date();
    date.setHours(time.hours, time.minutes, 0, 0);
    return date;
  };

  // Convert Date to time object
  const dateToTime = (date: Date) => {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
    };
  };

  // Format time for display
  const formatTime = (time: { hours: number; minutes: number } | undefined) => {
    if (!time) return '';
    
    const date = timeToDate(time);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24Hour,
    });
  };

  const handlePress = () => {
    if (disabled) return;
    
    setIsFocused(true);
    setShowPicker(true);
    onFocus?.();
    onModalOpen?.();
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'dismissed') {
      setIsFocused(false);
      onBlur?.();
      onModalClose?.();
      return;
    }
    
    if (selectedDate) {
      onValueChange(dateToTime(selectedDate));
    }
    
    if (Platform.OS === 'android') {
      setIsFocused(false);
      onBlur?.();
      onModalClose?.();
    }
  };

  const handleIOSModalClose = () => {
    setShowPicker(false);
    setIsFocused(false);
    onBlur?.();
    onModalClose?.();
  };

  const handleClear = () => {
    onValueChange(undefined);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={disabled}>
        <TextInput
          label={label}
          value={formatTime(value)}
          placeholder={placeholder}
          mode={inputMode}
          disabled={disabled}
          error={error}
          dense={dense}
          editable={false}
          pointerEvents="none"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
          style={[
            styles.input,
            {
              backgroundColor: backgroundColor || theme.colors.background.secondary,
              minHeight: 60,
            },
            style,
          ]}
          outlineStyle={{ borderRadius: 6 }}
          contentStyle={[
            {
              color: textColor || theme.colors.text.primary,
            },
            contentStyle,
          ]}
          outlineColor={outlineColor || theme.colors.border.light}
          activeOutlineColor={activeOutlineColor || theme.colors.primary}
          left={
            showClockIcon ? (
              <TextInput.Icon
                icon={() => (
                  <Feather
                    name={clockIcon as any}
                    size={20}
                    color={disabled ? theme.colors.text.disabled : theme.colors.text.secondary}
                  />
                )}
                onPress={handlePress}
              />
            ) : undefined
          }
          right={
            showClearIcon && value ? (
              <TextInput.Icon
                icon={() => (
                  <Feather
                    name={clearIcon as any}
                    size={16}
                    color={theme.colors.text.secondary}
                  />
                )}
                onPress={handleClear}
              />
            ) : undefined
          }
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={is24Hour}
          minuteInterval={minuteInterval}
        />
              )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
  },
}); 