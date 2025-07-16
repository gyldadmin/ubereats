import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../../styles/theme';

interface DateTimePickerInputProps {
  label: string;
  value: Date | undefined;
  onValueChange: (date: Date | undefined) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  mode?: 'datetime' | 'date' | 'time';
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputMode?: 'outlined' | 'flat';
  dense?: boolean;
  textColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  calendarIcon?: string;
  clearIcon?: string;
  showCalendarIcon?: boolean;
  showClearIcon?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  contentStyle?: any;
  testID?: string;
}

export default function DateTimePickerInput({
  label,
  value,
  onValueChange,
  placeholder = 'Select date & time',
  minimumDate,
  maximumDate,
  mode = 'datetime',
  error = false,
  disabled = false,
  required,
  inputMode = 'outlined',
  dense = false,
  textColor,
  backgroundColor,
  outlineColor,
  activeOutlineColor,
  calendarIcon = 'calendar',
  clearIcon = 'x',
  showCalendarIcon = true,
  showClearIcon = true,
  onFocus,
  onBlur,
  accessibilityLabel,
  accessibilityHint,
  style,
  contentStyle,
  testID,
}: DateTimePickerInputProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState<'date' | 'time'>('date');

  const formatDateSegment = (date: Date | undefined) => {
    if (!date) return 'Select date';
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTimeSegment = (date: Date | undefined) => {
    if (!date) return 'Select time';
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const DateTimeSegments = () => {
    if (mode === 'date') {
      return (
        <View style={styles.segmentContainer}>
          <View style={styles.segment}>
            <Text style={styles.segmentText}>{formatDateSegment(value)}</Text>
          </View>
        </View>
      );
    }
    
    if (mode === 'time') {
      return (
        <View style={styles.segmentContainer}>
          <View style={styles.segment}>
            <Text style={styles.segmentText}>{formatTimeSegment(value)}</Text>
          </View>
        </View>
      );
    }
    
    // datetime mode - show both segments
    return (
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={styles.segment} 
          onPress={() => {
            setCurrentMode('date');
            setPickerVisible(true);
          }}
        >
          <Text style={styles.segmentText}>{formatDateSegment(value)}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.segment} 
          onPress={() => {
            setCurrentMode('time');
            setPickerVisible(true);
          }}
        >
          <Text style={styles.segmentText}>{formatTimeSegment(value)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handlePress = () => {
    if (disabled) return;
    
    const modeToUse = mode === 'datetime' ? 'date' : mode;
    
    if (Platform.OS === 'android') {
      // Use imperative API on Android (recommended)
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
    
    onFocus?.();
  };

  const handleConfirm = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === 'android') {
      // Android imperative API doesn't need to hide picker manually
    } else {
      // iOS component API
      setPickerVisible(false);
    }
    
    if (selectedDate) {
      onValueChange(selectedDate);
    }
    onBlur?.();
  };

  const handleCancel = () => {
    setPickerVisible(false);
    onBlur?.();
  };

  const handleClear = () => {
    onValueChange(undefined);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} disabled={disabled}>
        <TextInput
          label={label}
          value="" // Empty value since we're using custom render
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
          render={() => <DateTimeSegments />}
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
            showCalendarIcon ? (
              <TextInput.Icon
                icon={() => (
                  <Feather
                    name={calendarIcon as any}
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
      
      {/* FIX: Only show native picker on iOS and when visible */}
      {isPickerVisible && Platform.OS === 'ios' && (
        <DateTimePicker
          display="compact" // Better display mode for iOS
          value={value || new Date()}
          mode={currentMode}
          is24Hour={true}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleConfirm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  segment: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  segmentText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
}); 