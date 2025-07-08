import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

interface FacebookTopNavTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: Array<{
    value: string;
    label: string;
  }>;
  style?: any;
}

export default function FacebookTopNavTabs({
  value,
  onValueChange,
  buttons,
  style,
}: FacebookTopNavTabsProps) {
  return (
    <View style={[styles.container, style]}>
      {buttons.map((button) => {
        const isSelected = value === button.value;
        
        return (
          <TouchableOpacity
            key={button.value}
            style={[
              styles.tab,
              isSelected && styles.selectedTab,
            ]}
            onPress={() => onValueChange(button.value)}
            activeOpacity={0.7}
          >
            <Text
              variant="bodyMedium"
              style={[
                styles.tabText,
                isSelected && styles.selectedTabText,
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
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedTab: {
    backgroundColor: 'rgba(19, 190, 199, 0.15)', // Light teal background like Facebook's blue
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 15,
    textAlign: 'center',
  },
  selectedTabText: {
    color: theme.colors.primary,
    fontWeight: '700', // Increased from 600 to 700
  },
}); 