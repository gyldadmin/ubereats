import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Checkbox } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface MultiChoiceOption {
  value: string;
  label: string;
}

interface MultiChoiceSelectorProps {
  label: string;
  options: MultiChoiceOption[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  maxHeight?: number;
}

export default function MultiChoiceSelector({
  label,
  options,
  selectedValues,
  onValueChange,
  disabled = false,
  error = false,
  placeholder = 'Choose',
  maxHeight = 200
}: MultiChoiceSelectorProps) {
  
  const toggleOption = (value: string) => {
    if (disabled) return;
    
    if (selectedValues.includes(value)) {
      // Remove from selection
      onValueChange(selectedValues.filter(v => v !== value));
    } else {
      // Add to selection
      onValueChange([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      <ScrollView 
        style={[styles.optionsContainer, { maxHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {options.length === 0 ? (
          <Text style={styles.debugText}>
            No options available (Debug: {options.length} options, label: {label})
          </Text>
        ) : (
          options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionRow,
                  disabled && styles.optionRowDisabled,
                  error && styles.optionRowError
                ]}
                onPress={() => toggleOption(option.value)}
                disabled={disabled}
              >
                <Checkbox
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => toggleOption(option.value)}
                  disabled={disabled}
                  color={theme.colors.primary}
                />
                <Text style={[
                  styles.optionText,
                  disabled && styles.optionTextDisabled,
                  isSelected && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      
      {selectedValues.length === 0 && (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
      
      {selectedValues.length > 0 && (
        <Text style={styles.selectedCount}>
          {selectedValues.length} selected
        </Text>
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
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  labelError: {
    color: theme.colors.status?.error || '#e74c3c',
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    minHeight: 120, // Add minimum height to ensure container is visible
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionRowError: {
    borderBottomColor: theme.colors.status?.error || '#e74c3c',
  },
  optionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  optionTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  optionTextSelected: {
    fontWeight: theme.typography.weights.medium,
  },
  placeholder: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  selectedCount: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  debugText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    fontStyle: 'italic',
  },
}); 