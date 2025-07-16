import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { Snackbar, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { BRAND_COLOR } from '../../constants/theme';

interface EventDateTimePickerProps {
  label: string;
  startTime: Date;
  endTime: Date;
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange: (date: Date) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function EventDateTimePicker({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  error = false,
}: EventDateTimePickerProps) {
  
  // Duration and display state
  const [durationMode, setDurationMode] = useState<'0.5' | '1' | '1.5' | '2' | 'other'>('1.5');
  const [customDuration, setCustomDuration] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  
  // Animation for smooth transitions
  const fadeAnim = useState(new Animated.Value(1))[0];
  const endTimeAnim = useState(new Animated.Value(0))[0];

  // Initialize showEndTime based on endTime prop
  useEffect(() => {
    if (endTime && endTime > new Date(startTime.getTime() + 2 * 60 * 60 * 1000)) {
      setShowEndTime(true);
      // Set animation values for end time mode
      fadeAnim.setValue(0);
      endTimeAnim.setValue(1);
    }
  }, [endTime, startTime, fadeAnim, endTimeAnim]);

  // Duration options for dropdown
  const durationOptions = [
    { value: '0.5', label: '30 min' },
    { value: '1', label: '1 hr' },
    { value: '1.5', label: '1.5 hrs' },
    { value: '2', label: '2 hrs' },
    { value: 'other', label: 'Other' },
  ];

  // Calculate end time based on start time and duration
  const calculateEndTime = (start: Date, durationHours: number) => {
    const end = new Date(start);
    end.setHours(start.getHours() + Math.floor(durationHours));
    end.setMinutes(start.getMinutes() + (durationHours % 1) * 60);
    return end;
  };

  // Validate custom duration input
  const validateCustomDuration = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (num < 0.5 || num > 24) return false;
    // Check if it's in half-hour increments
    const remainder = (num * 2) % 1;
    return remainder === 0;
  };

  // Handle duration change with smooth transition to end time mode
  const handleDurationChange = (value: string) => {
    if (value === 'other') {
      // Animate transition to end time mode
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowEndTime(true);
        setShowDurationDropdown(false);
        
        // Set appropriate end time
        const currentEndTime = endTime;
        const defaultEndTime = calculateEndTime(startTime, 1.5);
        
        if (!currentEndTime || currentEndTime <= startTime) {
          onEndTimeChange(defaultEndTime);
        }
        
        // Show end time container
        Animated.timing(endTimeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setDurationMode(value as any);
      setShowDurationDropdown(false);
      const durationHours = parseFloat(value);
      const newEndTime = calculateEndTime(startTime, durationHours);
      onEndTimeChange(newEndTime);
    }
  };

  // Handle custom duration input
  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    
    if (value.trim() === '') return;
    
    if (validateCustomDuration(value)) {
      const durationHours = parseFloat(value);
      const newEndTime = calculateEndTime(startTime, durationHours);
      onEndTimeChange(newEndTime);
    } else {
      setShowToast(true);
    }
  };

  // Handle start time change
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onStartTimeChange(selectedDate);
      
      if (!showEndTime) {
        // Recalculate end time based on current duration
        let durationHours = 1.5; // default
        if (durationMode === 'other') {
          if (customDuration && validateCustomDuration(customDuration)) {
            durationHours = parseFloat(customDuration);
          }
        } else {
          durationHours = parseFloat(durationMode);
        }
        
        const newEndTime = calculateEndTime(selectedDate, durationHours);
        onEndTimeChange(newEndTime);
      }
    }
  };

  // Handle end time change
  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      onEndTimeChange(selectedDate);
    }
  };

  // Get display text for duration
  const getDurationDisplayText = () => {
    if (durationMode === 'other') {
      return customDuration || 'Custom';
    }
    return durationOptions.find(opt => opt.value === durationMode)?.label || '1.5 hrs';
  };

  // Set minimum date to current time
  const minimumDate = new Date();

  // Paper-style container component
  const PaperContainer = ({ title, children, style }: { title: string; children: React.ReactNode; style?: any }) => (
    <View style={[styles.paperContainer, style]}>
      <View style={styles.paperTitle}>
        <Text style={styles.paperTitleText}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Container 1 - Start Time & Duration */}
      <PaperContainer title={showEndTime ? "Start Time" : "Start Time & Duration"}>
        <View style={styles.unifiedContainer}>
          {/* Left Side - Date/Time Picker */}
          <View style={styles.leftSection}>
            <DateTimePicker
              value={startTime}
              mode="datetime"
              accentColor={BRAND_COLOR}
              minuteInterval={15}
              minimumDate={minimumDate}
              onChange={handleStartTimeChange}
              disabled={disabled}
              style={styles.dateTimePicker}
            />
          </View>

          {/* Right Side - Duration Selector (only if not showing end time) */}
          {!showEndTime && (
            <View style={styles.rightSection}>
              <Animated.View style={[styles.durationContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity
                  onPress={() => setShowDurationDropdown(!showDurationDropdown)}
                  style={styles.durationSelector}
                  disabled={disabled}
                >
                  <Text style={styles.durationText}>{getDurationDisplayText()}</Text>
                  <Feather 
                    name={showDurationDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Duration Dropdown Menu */}
              {showDurationDropdown && (
                <View style={styles.dropdownMenu}>
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleDurationChange(option.value)}
                      style={[
                        styles.dropdownItem,
                        durationMode === option.value && styles.dropdownItemSelected
                      ]}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        durationMode === option.value && styles.dropdownItemTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </PaperContainer>

      {/* Container 2 - End Time (only if showEndTime is true) */}
      {showEndTime && (
        <Animated.View style={[styles.endTimeContainer, { opacity: endTimeAnim }]}>
          <PaperContainer title="End Time">
            <View style={styles.unifiedContainer}>
              <View style={styles.fullWidthSection}>
                <DateTimePicker
                  value={endTime}
                  mode="datetime"
                  accentColor={BRAND_COLOR}
                  minuteInterval={15}
                  minimumDate={startTime}
                  onChange={handleEndTimeChange}
                  disabled={disabled}
                  style={styles.dateTimePicker}
                />
              </View>
            </View>
          </PaperContainer>
        </Animated.View>
      )}

      {/* Toast Notification */}
      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={3000}
        style={styles.toast}
      >
        <Text style={styles.toastText}>
          Enter durations in half hour units, like 2.5 or 3, up to 24 hours
        </Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  paperContainer: {
    position: 'relative',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  paperTitle: {
    position: 'absolute',
    top: -10,
    left: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 1,
  },
  paperTitleText: {
    fontSize: theme.typography.styles.caption.fontSize,
    fontWeight: '600',
    color: BRAND_COLOR,
  },
  unifiedContainer: {
    flexDirection: 'row',
    minHeight: 54,
    alignItems: 'center',
  },
  leftSection: {
    flex: 2,
    justifyContent: 'center',
    paddingRight: theme.spacing.sm,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    marginLeft: theme.spacing.sm,
  },
  fullWidthSection: {
    flex: 1,
    justifyContent: 'center',
  },
  dateTimePicker: {
    alignSelf: 'flex-start',
  },
  durationContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#ebebeb',
    borderRadius: 6,
    minHeight: 34,
    maxHeight: 34,
    marginLeft: 8,
  },
  durationText: {
    fontSize: 18,
    fontWeight: theme.typography.styles.body.fontWeight,
    color: theme.colors.text.primary,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ebebeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    marginTop: theme.spacing.xs,
  },
  dropdownItem: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    minHeight: 34,
    justifyContent: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: `${BRAND_COLOR}15`,
  },
  dropdownItemText: {
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: BRAND_COLOR,
    fontWeight: '600',
  },
  endTimeContainer: {
    marginTop: 20,
  },
  toast: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
  },
  toastText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.styles.body.fontSize,
    fontWeight: 'normal',
  },
}); 