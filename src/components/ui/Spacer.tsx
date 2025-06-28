/**
 * Spacer Component
 * 
 * MANDATORY: Use this component for spacing between elements
 * Provides consistent spacing that follows the design system
 * 
 * DO NOT use manual margins/padding - use <Spacer> instead
 */

import React from 'react';
import { View } from 'react-native';
import { theme } from '../../styles/theme';

type SpacingSize = keyof typeof theme.spacing;

interface SpacerProps {
  size?: SpacingSize;
  horizontal?: boolean;
  flex?: boolean;
}

export const Spacer: React.FC<SpacerProps> = ({ 
  size = 'md', 
  horizontal = false,
  flex = false,
}) => {
  // Ensure we get a number value for spacing
  const spacingValue = typeof theme.spacing[size] === 'number' 
    ? theme.spacing[size] 
    : theme.spacing.md;
  
  if (flex) {
    return <View style={{ flex: 1 }} />;
  }
  
  return (
    <View 
      style={{
        width: horizontal ? spacingValue : undefined,
        height: horizontal ? undefined : spacingValue,
      }} 
    />
  );
};

/**
 * USAGE EXAMPLES:
 * 
 * // Vertical spacing between components
 * <Typography variant="h1">Title</Typography>
 * <Spacer size="lg" />
 * <Typography variant="body">Content</Typography>
 * 
 * // Horizontal spacing in a row
 * <View style={{ flexDirection: 'row' }}>
 *   <Button>Left</Button>
 *   <Spacer size="md" horizontal />
 *   <Button>Right</Button>
 * </View>
 * 
 * // Flexible spacer to push content apart
 * <View style={{ flexDirection: 'row' }}>
 *   <Typography>Left content</Typography>
 *   <Spacer flex />
 *   <Typography>Right content</Typography>
 * </View>
 * 
 * // Different spacing sizes
 * <Spacer size="xs" />   // 4px
 * <Spacer size="sm" />   // 8px
 * <Spacer size="md" />   // 12px (default)
 * <Spacer size="lg" />   // 16px
 * <Spacer size="xl" />   // 20px
 * <Spacer size="xxl" />  // 24px
 * <Spacer size="xxxl" /> // 32px
 */

/**
 * SPACING GUIDE:
 * 
 * xs (4px): Tight spacing, form elements
 * sm (8px): Close related elements
 * md (12px): Default spacing between components
 * lg (16px): Section spacing
 * xl (20px): Large section spacing
 * xxl (24px): Major section breaks
 * xxxl (32px): Page-level spacing
 */ 