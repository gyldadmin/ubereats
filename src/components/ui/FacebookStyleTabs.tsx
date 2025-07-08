import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface FacebookStyleTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function FacebookStyleTabs({
  value,
  onValueChange,
  buttons,
  style,
}: FacebookStyleTabsProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabRow}>
        {buttons.map((button) => {
          const isSelected = value === button.value;
          
          return (
            <TouchableOpacity
              key={button.value}
              style={styles.tab}
              onPress={() => onValueChange(button.value)}
              activeOpacity={0.7}
            >
              <Text
                variant="bodyLarge"
                style={[
                  styles.tabText,
                  isSelected && styles.selectedTabText,
                ]}
              >
                {button.label}
              </Text>
              <View
                style={[
                  styles.indicator,
                  isSelected && styles.selectedIndicator,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 20,
  },
  selectedTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: 'transparent',
    borderRadius: 1.5,
  },
  selectedIndicator: {
    backgroundColor: theme.colors.primary,
  },
  bottomBorder: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    opacity: 0.3,
  },
}); 