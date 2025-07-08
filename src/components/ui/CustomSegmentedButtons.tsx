import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface CustomSegmentedButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function CustomSegmentedButtons({
  value,
  onValueChange,
  buttons,
  style,
}: CustomSegmentedButtonsProps) {
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button, index) => {
        const isSelected = value === button.value;
        const isFirst = index === 0;
        const isLast = index === buttons.length - 1;
        
        return (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.button,
              isSelected && styles.selectedButton,
              isFirst && styles.firstButton,
              isLast && styles.lastButton,
            ]}
            onPress={() => onValueChange(button.value)}
          >
            <Text
              variant="labelLarge"
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
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 25,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  firstButton: {
    marginRight: 2,
  },
  lastButton: {
    marginLeft: 2,
  },
  label: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  selectedLabel: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
}); 