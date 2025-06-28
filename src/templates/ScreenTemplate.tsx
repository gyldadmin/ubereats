/**
 * SCREEN TEMPLATE
 * 
 * CRITICAL: Copy this exact pattern when creating new screens
 * This template demonstrates the mandatory design system usage
 * 
 * AI INSTRUCTION: Use this as the foundation for ALL new screens
 */

import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenLayout, Typography, Spacer } from '../components/ui';
import { componentStyles } from '../styles/componentStyles';
import { theme } from '../styles/theme';

interface ScreenTemplateProps {
  // Define your props here
}

export const ScreenTemplate: React.FC<ScreenTemplateProps> = () => {
  return (
    <ScreenLayout scrollable withHeader>
      {/* Page Title - Always use Typography with h1 variant */}
      <Typography variant="h1">Screen Title</Typography>
      <Spacer size="lg" />
      
      {/* Section Header */}
      <Typography variant="h2">Section Title</Typography>
      <Spacer size="md" />
      
      {/* Body Content */}
      <Typography variant="body" color="secondary">
        This is the main content area. Always use Typography component
        for text and Spacer component for spacing between elements.
      </Typography>
      <Spacer size="xl" />
      
      {/* Card Example */}
      <View style={componentStyles.standardCard}>
        <Typography variant="title">Card Title</Typography>
        <Spacer size="sm" />
        <Typography variant="body">
          Card content goes here. Use componentStyles for common patterns.
        </Typography>
      </View>
      <Spacer size="lg" />
      
      {/* Form Example */}
      <View style={componentStyles.formGroup}>
        <Typography variant="subtitle" style={componentStyles.formLabel}>
          Form Label
        </Typography>
        <Spacer size="xs" />
        {/* React Native Paper components can be used within the system */}
        <Button mode="contained">Submit</Button>
      </View>
      <Spacer size="xl" />
      
      {/* List Example */}
      <Typography variant="h3">List Section</Typography>
      <Spacer size="md" />
      
      <View style={componentStyles.listItem}>
        <Typography variant="body">List Item 1</Typography>
      </View>
      
      <View style={componentStyles.listItem}>
        <Typography variant="body">List Item 2</Typography>
      </View>
      
      <View style={componentStyles.listItem}>
        <Typography variant="body">List Item 3</Typography>
      </View>
      
      <Spacer size="xl" />
      
      {/* Button Group Example */}
      <View style={componentStyles.buttonGroup}>
        <Button mode="outlined" style={{ flex: 1 }}>
          Cancel
        </Button>
        <Spacer size="md" horizontal />
        <Button mode="contained" style={{ flex: 1 }}>
          Confirm
        </Button>
      </View>
    </ScreenLayout>
  );
};

/**
 * TEMPLATE VARIATIONS:
 * 
 * // Basic non-scrollable screen
 * <ScreenLayout>
 *   <Typography variant="h1">Title</Typography>
 *   <Spacer size="lg" />
 *   // content
 * </ScreenLayout>
 * 
 * // Centered content (loading, empty states)
 * <ScreenLayout centered>
 *   <Typography variant="h2" align="center">Loading...</Typography>
 * </ScreenLayout>
 * 
 * // Full bleed (special screens)
 * <ScreenLayout fullBleed>
 *   // custom content that needs full width
 * </ScreenLayout>
 */

/**
 * MANDATORY CHECKLIST:
 * ✅ Uses ScreenLayout as root wrapper
 * ✅ Uses Typography for all text
 * ✅ Uses Spacer for all spacing
 * ✅ Uses componentStyles for layout patterns
 * ✅ Uses theme.colors for colors (when needed)
 * ✅ No hardcoded values
 * ✅ No raw <Text> components
 * ✅ No manual margins/padding
 */ 