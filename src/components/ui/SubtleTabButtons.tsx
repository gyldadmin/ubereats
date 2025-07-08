import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface SubtleTabButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function SubtleTabButtons({
  value,
  onValueChange,
  buttons,
  style,
}: SubtleTabButtonsProps) {
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button) => {
        const isSelected = value === button.value;
        
        return (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.button,
              isSelected && styles.selectedButton,
            ]}
            onPress={() => onValueChange(button.value)}
          >
            <Text
              variant="bodyMedium"
              style={[
                styles.label,
                isSelected && styles.selectedLabel,
              ]}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedButton: {
    backgroundColor: 'rgba(19, 190, 199, 0.08)', // Very subtle background
  },
  label: {
    color: theme.colors.text.tertiary, // Light gray for unselected
    fontWeight: '400',
    fontSize: 13,
  },
  selectedLabel: {
    color: theme.colors.text.secondary, // Slightly darker for selected
    fontWeight: '500',
  },
}); 