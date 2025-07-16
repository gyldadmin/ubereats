import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Switch } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface ToggleProps {
  label?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  color?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
  labelStyle?: any;
  testID?: string;
}

// App's default toggle (switch) with consistent styling
export const Toggle = ({
  label,
  value,
  onValueChange,
  disabled = false,
  error = false,
  required,
  color,
  accessibilityLabel,
  accessibilityHint,
  style,
  labelStyle,
  testID,
}: ToggleProps) => {
  const handlePress = () => {
    if (disabled) return;
    onValueChange(!value);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.toggleContainer}>
        {label && (
          <Text 
            style={[
              styles.label,
              error && styles.labelError,
              disabled && styles.labelDisabled,
              labelStyle,
            ]}
            onPress={handlePress}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          color={color || theme.colors.primary}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
        />
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  labelError: {
    color: theme.colors.error || '#e74c3c',
  },
  labelDisabled: {
    color: theme.colors.text.disabled,
  },
  required: {
    color: theme.colors.error || '#e74c3c',
  },

}); 