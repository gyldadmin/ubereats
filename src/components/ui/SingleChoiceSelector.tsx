import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface SingleChoiceOption {
  value: string;
  label: string;
}

interface SingleChoiceSelectorProps {
  label: string;
  options: SingleChoiceOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  maxHeight?: number;
  allowDeselect?: boolean;
}

export default function SingleChoiceSelector({
  label,
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  error = false,
  placeholder = 'Choose',
  maxHeight = 200,
  allowDeselect = false
}: SingleChoiceSelectorProps) {
  
  const selectOption = (value: string) => {
    if (disabled) return;
    
    if (allowDeselect && selectedValue === value) {
      // Deselect if already selected and deselection is allowed
      onValueChange('');
    } else {
      // Select the option
      onValueChange(value);
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
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                disabled && styles.optionRowDisabled,
                error && styles.optionRowError
              ]}
              onPress={() => selectOption(option.value)}
              disabled={disabled}
            >
              <RadioButton
                value={option.value}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => selectOption(option.value)}
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
        })}
      </ScrollView>
      
      {!selectedValue && (
        <Text style={styles.placeholder}>{placeholder}</Text>
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
}); 