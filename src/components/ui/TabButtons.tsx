import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface TabButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function TabButtons({
  value,
  onValueChange,
  buttons,
  style,
}: TabButtonsProps) {
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button) => {
        const isSelected = value === button.value;
        
        return (
          <TouchableOpacity
            key={button.value}
            style={styles.button}
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
            <View
              style={[
                styles.underline,
                isSelected && styles.selectedUnderline,
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  selectedLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: 'transparent',
  },
  selectedUnderline: {
    backgroundColor: theme.colors.primary,
  },
}); 