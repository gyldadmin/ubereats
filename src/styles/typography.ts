/**
 * Typography system
 * Font sizes, weights, and line heights
 */

export const typography = {
  // Font sizes
  sizes: {
    xs: 12,       // Small text, captions
    sm: 14,       // Body text, addresses
    md: 16,       // Subtitles, secondary text
    lg: 18,       // Larger body text
    xl: 20,       // Titles, card titles
    xxl: 24,      // Headers, page titles
    xxxl: 28,     // Large headers
    huge: 32,     // Hero text
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (relative to font size)
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  // Semantic font styles
  styles: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 1.4,
    },
    title: {
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 1.4,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.4,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
  },
} as const;

export type Typography = typeof typography; 