/**
 * Typography Component
 * 
 * MANDATORY: Use this component instead of raw <Text> components
 * Provides consistent typography that follows the design system
 * 
 * DO NOT use <Text> directly - always use <Typography>
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { theme } from '../../styles/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'caption' | 'button';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'inverse';

interface TypographyProps extends Omit<TextProps, 'style'> {
  variant?: TypographyVariant;
  color?: TextColor;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: keyof typeof theme.typography.weights;
  size?: keyof typeof theme.typography.sizes;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  size,
  style,
  children,
  ...props
}) => {
  // Get base style from variant
  const variantStyle = theme.typography.styles[variant];
  
  // Override with custom props if provided
  const customStyle: TextStyle = {
    ...variantStyle,
    color: theme.colors.text[color],
    textAlign: align,
    ...(weight && { fontWeight: theme.typography.weights[weight] }),
    ...(size && { fontSize: theme.typography.sizes[size] }),
    ...style,
  };

  return (
    <Text style={customStyle} {...props}>
      {children}
    </Text>
  );
};

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage with variants
 * <Typography variant="h1">Main Title</Typography>
 * <Typography variant="body">Body text content</Typography>
 * <Typography variant="caption" color="secondary">Small caption</Typography>
 * 
 * // Custom overrides when needed
 * <Typography variant="body" weight="bold" align="center">
 *   Centered bold text
 * </Typography>
 * 
 * // Custom size while maintaining other variant properties
 * <Typography variant="title" size="lg">
 *   Slightly larger title
 * </Typography>
 * 
 * // Custom color
 * <Typography variant="body" color="tertiary">
 *   Muted text
 * </Typography>
 */

/**
 * VARIANT GUIDE:
 * 
 * h1, h2, h3: Page/section headers (bold, large)
 * title: Component titles (bold, medium-large)
 * subtitle: Section subtitles (medium weight, medium size)
 * body: Main content text (normal weight, readable size)
 * caption: Small text, labels, metadata (small, light)
 * button: Button text (semibold, readable)
 */ 