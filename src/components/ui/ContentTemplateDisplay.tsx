import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ProcessedContentTemplate } from '../../types/content';
import { colors, spacing, typography } from '../../styles';

interface ContentTemplateDisplayProps {
  contentTemplate: ProcessedContentTemplate;
  primaryTextStyle?: any;
  secondaryTextStyle?: any;
  tertiaryTextStyle?: any;
  containerStyle?: any;
  showPrimaryText?: boolean;
  showSecondaryText?: boolean;
  showTertiaryText?: boolean;
}

export function ContentTemplateDisplay({
  contentTemplate,
  primaryTextStyle,
  secondaryTextStyle,
  tertiaryTextStyle,
  containerStyle,
  showPrimaryText = true,
  showSecondaryText = true,
  showTertiaryText = true,
}: ContentTemplateDisplayProps) {
  
  // Simple markdown parser for **bold** text
  const parseMarkdownText = (text: string) => {
    // Split text by **bold** markers
    const parts = text.split(/(\*\*.*?\*\*)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** markers and make bold
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Primary Text */}
      {showPrimaryText && contentTemplate.processed_primary_text && (
        <Text style={[styles.primaryText, primaryTextStyle]}>
          {parseMarkdownText(contentTemplate.processed_primary_text)}
        </Text>
      )}
      
      {/* Secondary Text */}
      {showSecondaryText && contentTemplate.processed_secondary_text && (
        <Text style={[styles.secondaryText, secondaryTextStyle]}>
          {parseMarkdownText(contentTemplate.processed_secondary_text)}
        </Text>
      )}
      
      {/* Tertiary Text */}
      {showTertiaryText && contentTemplate.processed_tertiary_text && (
        <Text style={[styles.tertiaryText, tertiaryTextStyle]}>
          {parseMarkdownText(contentTemplate.processed_tertiary_text)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Default container styling
  },
  primaryText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.normal,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  secondaryText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.normal,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tertiaryText: {
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.normal,
    color: colors.text.primary,
  },
}); 