import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface SingleLineInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onValueChange?: (text: string) => void; // Support both prop names
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
  required?: boolean;
}

export default function SingleLineInput({
  label,
  value,
  onChangeText,
  onValueChange,
  placeholder = 'Type',
  error = false,
  disabled = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  maxLength,
  required
}: SingleLineInputProps) {
  // Support both prop names for backwards compatibility
  const handleChange = onChangeText || onValueChange;
  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        mode="outlined"
        disabled={disabled}
        error={error}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={styles.input}
        outlineColor={theme.colors.border.light}
        activeOutlineColor={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    minHeight: 60, // Set minimum height to 60 pixels
  },
}); 