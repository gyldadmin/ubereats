import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Menu } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface DropdownOption {
  value: string;
  label: string;
}

interface PaperDropdownProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  mode?: 'outlined' | 'flat';
  backgroundColor?: string;
  menuBackgroundColor?: string;
  menuMaxWidth?: number;
  menuMinWidth?: number;
}

export default function PaperDropdown({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  mode = 'outlined',
  backgroundColor = 'rgba(19, 190, 199, 0.08)',
  menuBackgroundColor = 'white',
  menuMaxWidth = 300,
  menuMinWidth = 200,
}: PaperDropdownProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Find the selected option to display its label
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        contentStyle={[
          styles.menuContent,
          {
            backgroundColor: menuBackgroundColor,
            minWidth: menuMinWidth,
            maxWidth: menuMaxWidth,
          }
        ]}
        anchor={
          <TextInput
            mode={mode}
            label={placeholder}
            value={displayValue}
            right={<TextInput.Icon 
              icon="chevron-down" 
              onPress={() => !disabled && setMenuVisible(true)} 
            />}
            onPress={() => !disabled && setMenuVisible(true)}
            editable={false}
            disabled={disabled}
            error={error}
            style={[
              styles.textInput,
              { backgroundColor: disabled ? theme.colors.background.disabled : backgroundColor }
            ]}
          />
        }
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onPress={() => handleOptionSelect(option.value)}
            title={option.label}
            titleStyle={styles.menuItemTitle}
          />
        ))}
      </Menu>
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
    color: theme.colors.status.error,
  },
  textInput: {
    // Background color set dynamically via style prop
  },
  menuContent: {
    borderRadius: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemTitle: {
    fontSize: theme.typography.styles.body.fontSize,
    color: theme.colors.text.primary,
  },
}); 