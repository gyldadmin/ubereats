import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { theme } from '../../../styles/theme';

interface SegmentedOption<T = string> {
  value: T;
  label: string;
  icon?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

interface SegmentedInputProps<T = string> {
  // Core functionality
  label: string;
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  options: SegmentedOption<T>[];
  
  // Selection behavior
  multiSelect?: boolean;
  maxSelections?: number;
  
  // Validation & states
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // Appearance
  density?: 'regular' | 'small' | 'medium' | 'high';
  
  // Colors & theming
  selectedColor?: string;
  unselectedColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  
  // Layout
  orientation?: 'horizontal' | 'vertical';
  distribution?: 'equal' | 'content';
  
  // Icons
  showIcons?: boolean;
  iconPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  // Events
  onPress?: (value: T) => void;
  onLongPress?: (value: T) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Styling
  style?: any;
  buttonStyle?: any;
  labelStyle?: any;
  
  // Testing
  testID?: string;
}

export default function SegmentedInput<T = string>({
  label,
  value,
  onValueChange,
  options,
  multiSelect = false,
  maxSelections,
  error = false,
  disabled = false,
  required,
  density = 'regular',
  selectedColor,
  unselectedColor,
  selectedTextColor,
  unselectedTextColor,
  orientation = 'horizontal',
  distribution = 'equal',
  showIcons = true,
  iconPosition = 'left',
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  buttonStyle,
  labelStyle,
  testID,
}: SegmentedInputProps<T>) {
  
  // Convert options to SegmentedButtons format
  const buttons = options.map((option) => ({
    value: option.value as string, // SegmentedButtons requires string values
    label: option.label,
    icon: showIcons && option.icon ? option.icon : undefined,
    disabled: option.disabled,
    accessibilityLabel: option.accessibilityLabel,
  }));

  // Handle single select value changes
  const handleSingleSelect = (selectedValue: string) => {
    const selectedOption = options.find(opt => String(opt.value) === selectedValue);
    if (selectedOption) {
      onValueChange(selectedOption.value);
      onPress?.(selectedOption.value);
    }
  };

  // Handle multi select value changes
  const handleMultiSelect = (selectedValue: string) => {
    const selectedOption = options.find(opt => String(opt.value) === selectedValue);
    if (!selectedOption) return;

    const currentValues = Array.isArray(value) ? value : [];
    const isSelected = currentValues.includes(selectedOption.value);

    if (isSelected) {
      // Remove from selection
      const newValues = currentValues.filter(v => v !== selectedOption.value);
      onValueChange(newValues);
    } else {
      // Add to selection
      const newValues = [...currentValues, selectedOption.value];
      
      // Check max selections limit
      if (maxSelections && newValues.length > maxSelections) {
        return; // Don't add if it would exceed max
      }
      
      onValueChange(newValues);
    }
    
    onPress?.(selectedOption.value);
  };

  // Get current selection for SegmentedButtons
  const getCurrentSelection = () => {
    if (multiSelect) {
      // For multi-select, SegmentedButtons doesn't support multiple selections natively
      // We'll need to handle this differently
      return Array.isArray(value) ? value.map(v => String(v)) : [];
    } else {
      return String(value || '');
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={[
        styles.label,
        error && styles.labelError,
        labelStyle,
      ]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Segmented Buttons */}
      <SegmentedButtons
        value={getCurrentSelection() as string}
        onValueChange={multiSelect ? handleMultiSelect : handleSingleSelect}
        buttons={buttons}
        density={density}
        style={[
          styles.segmentedButtons,
          {
            opacity: disabled ? 0.5 : 1,
          },
          buttonStyle,
        ]}
        // Theme customization through Paper's theme
      />

      {/* Multi-select indicator */}
      {multiSelect && Array.isArray(value) && value.length > 0 && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>
            Selected: {value.length}
            {maxSelections && ` / ${maxSelections}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.weights.medium,
  },
  labelError: {
    color: theme.colors.error || '#e74c3c',
  },
  required: {
    color: theme.colors.error || '#e74c3c',
  },
  segmentedButtons: {
    // Additional styling if needed
  },

  selectionIndicator: {
    marginTop: theme.spacing.xs,
    alignItems: 'flex-end',
  },
  selectionText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
}); 