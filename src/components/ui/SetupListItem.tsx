import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { SetupItemStatus } from '../../types/gatheringSetup';

interface SetupListItemProps {
  title: string;
  status: SetupItemStatus;
  onPress: () => void;
  teaserText?: string;
  showTopDivider?: boolean;
  showBottomDivider?: boolean;
  inlineLayout?: boolean;
}

export default function SetupListItem({
  title,
  status,
  onPress,
  teaserText,
  showTopDivider = false,
  showBottomDivider = true,
  inlineLayout = false,
}: SetupListItemProps) {
  // Determine visual states based on setup item status
  const isComplete = status !== SetupItemStatus.INCOMPLETE;
  const isTBD = status === SetupItemStatus.COMPLETE_TBD;
  const isFullyComplete = status === SetupItemStatus.COMPLETE;
  return (
    <View style={styles.container}>
      {/* Top divider */}
      {showTopDivider && (
        <Divider style={styles.divider} />
      )}
      
      {/* Setup item */}
      <TouchableOpacity 
        style={[
          styles.setupItem,
          isComplete && styles.setupItemComplete
        ]} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          {/* Completion Icon */}
          <View style={styles.iconContainer}>
            <Feather 
              name={isFullyComplete ? "check-circle" : "circle"} 
              size={20} 
              color={
                isTBD 
                  ? '#10B981' // Green color for COMPLETE_TBD state
                  : isComplete 
                    ? theme.colors.primary // Aqua color for COMPLETE state
                    : theme.colors.text.secondary // Grey color for INCOMPLETE state
              } 
            />
          </View>
          
          {/* Title and Teaser */}
          <View style={styles.textContainer}>
            {inlineLayout && teaserText ? (
              // Inline layout: title and teaser on same line
              <View style={styles.inlineContainer}>
                <Text variant="bodyLarge" style={[
                  styles.title,
                  isComplete && styles.titleComplete,
                  styles.inlineTitle
                ]}>
                  {title}
                </Text>
                <Text 
                  style={[styles.teaserText, styles.inlineTeaserText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {teaserText}
                </Text>
              </View>
            ) : (
              // Default stacked layout
              <>
                <Text variant="bodyLarge" style={[
                  styles.title,
                  isComplete && styles.titleComplete
                ]}>
                  {title}
                </Text>
                {isComplete && teaserText && (
                  <Text 
                    style={styles.teaserText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {teaserText}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
        
        {/* Right chevron */}
        <Feather 
          name="chevron-right" 
          size={20} 
          color={isComplete ? theme.colors.primary : theme.colors.text.secondary} 
        />
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
  setupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 72, // Height to accommodate two lines of text
    backgroundColor: theme.colors.background.primary,
  },
  setupItemComplete: {
    backgroundColor: `${theme.colors.primary}15`, // 15% opacity of brand color
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
  textContainer: {
    flex: 1,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '400',
  },
  titleComplete: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  teaserText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.6,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineTitle: {
    marginRight: theme.spacing.sm,
    flexShrink: 0, // Don't shrink the title
  },
  inlineTeaserText: {
    marginTop: 0,
    flex: 1, // Allow teaser text to take remaining space and truncate
    marginRight: theme.spacing.md, // Add space before chevron
  },
}); 