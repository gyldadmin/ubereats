import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface NavigationListItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  onPress: () => void;
  showTopDivider?: boolean;
  showBottomDivider?: boolean;
}

export default function NavigationListItem({
  icon,
  title,
  onPress,
  showTopDivider = false,
  showBottomDivider = true,
}: NavigationListItemProps) {
  return (
    <View style={styles.container}>
      {/* Top divider */}
      {showTopDivider && (
        <Divider style={styles.divider} />
      )}
      
      {/* Navigation item */}
      <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.leftContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Feather name={icon} size={20} color={theme.colors.text.primary} />
          </View>
          
          {/* Title */}
          <Text variant="bodyLarge" style={styles.title}>
            {title}
          </Text>
        </View>
        
        {/* Right chevron */}
        <Feather name="chevron-right" size={20} color={theme.colors.text.secondary} />
      </TouchableOpacity>
      
      {/* Bottom divider */}
      {showBottomDivider && (
        <Divider style={styles.divider} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  divider: {
    backgroundColor: theme.colors.border.light,
    height: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 56, // Standard list item height
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
}); 