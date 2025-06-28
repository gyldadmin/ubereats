/**
 * ScreenLayout Component
 * 
 * MANDATORY: Use this component as the root wrapper for ALL screens
 * Provides consistent padding, safe areas, scroll behavior, and background colors
 * 
 * DO NOT create custom screen containers - use this component instead
 */

import React from 'react';
import { View, ScrollView, SafeAreaView, ViewStyle } from 'react-native';
import { componentStyles } from '../../styles/componentStyles';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withHeader?: boolean;
  centered?: boolean;
  fullBleed?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  scrollable = false,
  withHeader = false,
  centered = false,
  fullBleed = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
  // Determine container style based on props
  const getContainerStyle = (): ViewStyle => {
    if (fullBleed) return componentStyles.screenFullBleed;
    if (centered) return componentStyles.screenCentered;
    if (withHeader) return componentStyles.screenWithHeader;
    return componentStyles.screen;
  };

  const containerStyle = [getContainerStyle(), style];

  if (scrollable) {
    return (
      <SafeAreaView style={containerStyle}>
        <ScrollView
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          contentContainerStyle={[
            componentStyles.contentContainer,
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      {children}
    </SafeAreaView>
  );
};

/**
 * USAGE EXAMPLES:
 * 
 * // Standard screen
 * <ScreenLayout>
 *   <Typography variant="h1">Title</Typography>
 * </ScreenLayout>
 * 
 * // Scrollable screen with header spacing
 * <ScreenLayout scrollable withHeader>
 *   <Typography variant="h1">Title</Typography>
 * </ScreenLayout>
 * 
 * // Centered content (loading, empty states)
 * <ScreenLayout centered>
 *   <ActivityIndicator />
 * </ScreenLayout>
 * 
 * // Full bleed (special screens like onboarding)
 * <ScreenLayout fullBleed>
 *   <CustomGradientBackground />
 * </ScreenLayout>
 */ 