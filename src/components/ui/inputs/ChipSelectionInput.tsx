import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { theme } from '../../../styles/theme';

interface ChipOption<T = any> {
  value: T;
  label: string;
  icon?: string;
  avatar?: React.ReactNode;
  disabled?: boolean;
}

interface ChipSelectionInputProps<T = any> {
  // Core functionality
  label: string;
  value: T | T[];
  onValueChange: (value: T | T[]) => void;
  options: ChipOption<T>[];
  
  // Selection behavior
  multiSelect?: boolean;
  maxSelections?: number;
  minSelections?: number;
  
  // Validation & states
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // Appearance
  mode?: 'flat' | 'outlined';
  compact?: boolean;
  elevated?: boolean;
  
  // Colors & theming
  selectedColor?: string;
  unselectedColor?: string;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  rippleColor?: string;
  
  // Layout
  layout?: 'wrap' | 'scroll';
  columns?: number;
  spacing?: number;
  
  // Selection indicators
  showSelectedOverlay?: boolean;
  showSelectedCheck?: boolean;
  
  // Events
  onPress?: (value: T) => void;
  onLongPress?: (value: T) => void;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  
  // Styling
  style?: any;
  chipContainerStyle?: any;
  chipStyle?: any;
  chipTextStyle?: any;
  
  // Testing
  testID?: string;
}

export default function ChipSelectionInput<T = any>({
  label,
  value,
  onValueChange,
  options,
  multiSelect = false,
  maxSelections,
  minSelections,
  error = false,
  disabled = false,
  required,
  mode = 'outlined',
  compact = false,
  elevated = false,
  selectedColor,
  unselectedColor,
  selectedTextColor,
  unselectedTextColor,
  rippleColor,
  layout = 'wrap',
  columns,
  spacing = theme.spacing.sm,
  showSelectedOverlay = true,
  showSelectedCheck = true,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  chipContainerStyle,
  chipStyle,
  chipTextStyle,
  testID,
}: ChipSelectionInputProps<T>) {
  
  // Get current selection as array
  const getCurrentSelection = (): T[] => {
    if (multiSelect) {
      return Array.isArray(value) ? value : [];
    } else {
      return value !== undefined ? [value] : [];
    }
  };

  // Check if option is selected
  const isSelected = (optionValue: T): boolean => {
    const currentSelection = getCurrentSelection();
    return currentSelection.includes(optionValue);
  };

  // Handle option press
  const handleOptionPress = (optionValue: T) => {
    if (disabled) return;
    
    const selectedOptions = getCurrentSelection();
    const isOptionSelected = isSelected(optionValue);

    if (multiSelect) {
      if (isOptionSelected) {
        // Remove from selection
        const newSelection = selectedOptions.filter(v => v !== optionValue);
        
        // Check minimum selections
        if (minSelections && newSelection.length < minSelections) {
          return; // Don't remove if it would go below minimum
        }
        
        onValueChange(newSelection);
      } else {
        // Add to selection
        const newSelection = [...selectedOptions, optionValue];
        
        // Check maximum selections
        if (maxSelections && newSelection.length > maxSelections) {
          return; // Don't add if it would exceed maximum
        }
        
        onValueChange(newSelection);
      }
    } else {
      // Single select
      if (isOptionSelected) {
        // Deselect current
        onValueChange(undefined as T);
      } else {
        // Select new option
        onValueChange(optionValue);
      }
    }
    
    onPress?.(optionValue);
  };

  // Handle long press
  const handleLongPress = (optionValue: T) => {
    if (disabled) return;
    onLongPress?.(optionValue);
  };

  // Render chip
  const renderChip = (option: ChipOption<T>, index: number) => {
    const selected = isSelected(option.value);
    const lightBrandColor = "#b3f0f2"; // Light blend of #13bec7 with white
    
    return (
      <Chip
        key={index}
        mode={selected ? "flat" : "outlined"}
        selected={selected}
        compact={compact}
        elevated={elevated}
        disabled={disabled || option.disabled}
        icon={option.icon}
        avatar={option.avatar}
        selectedColor={selected ? lightBrandColor : undefined}
        rippleColor={rippleColor}
        showSelectedOverlay={false}
        showSelectedCheck={false}
        onPress={() => handleOptionPress(option.value)}
        onLongPress={() => handleLongPress(option.value)}
        style={[
          styles.chip,
          {
            backgroundColor: selected 
              ? lightBrandColor
              : "white",
            borderColor: selected 
              ? lightBrandColor
              : theme.colors.border.light,
            borderWidth: selected ? 1 : 1,
          },
          chipStyle,
        ]}
        textStyle={[
          {
            color: selected 
              ? "#13bec7"
              : theme.colors.text.secondary,
            fontWeight: selected ? 'bold' : 'normal',
          },
          chipTextStyle,
        ]}
        testID={`${testID}-chip-${index}`}
      >
        {option.label}
      </Chip>
    );
  };

  // Render chips container
  const renderChipsContainer = () => {
    if (layout === 'scroll') {
      return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { gap: spacing },
            chipContainerStyle,
          ]}
        >
          {options.map((option, index) => renderChip(option, index))}
        </ScrollView>
      );
    } else {
      return (
        <View style={[
          styles.wrapContainer,
          {
            gap: spacing,
          },
          chipContainerStyle,
        ]}>
          {options.map((option, index) => renderChip(option, index))}
        </View>
      );
    }
  };

  const currentSelection = getCurrentSelection();

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Label */}
      <Text style={[
        styles.label,
        error && styles.labelError,
      ]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Chips */}
      {renderChipsContainer()}

      {/* Selection counter */}
      {multiSelect && currentSelection.length > 0 && (
        <View style={styles.selectionIndicator}>
          <Text style={styles.selectionText}>
            Selected: {currentSelection.length}
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
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
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