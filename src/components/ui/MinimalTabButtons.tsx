import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface MinimalTabButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function MinimalTabButtons({
  value,
  onValueChange,
  buttons,
  style,
}: MinimalTabButtonsProps) {
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button, index) => {
        const isSelected = value === button.value;
        
        return (
          <React.Fragment key={button.value}>
            <TouchableOpacity
              style={styles.button}
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
              {isSelected && (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
            {index < buttons.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    color: theme.colors.text.tertiary, // Light gray for unselected
    fontWeight: '400',
    fontSize: 14,
  },
  selectedLabel: {
    color: theme.colors.primary, // Brand color for selected
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border.light,
    opacity: 0.3,
  },
}); 