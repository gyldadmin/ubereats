/**
 * Main theme object
 * Combines all design tokens into a single theme
 */

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { layout } from './layout';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  typography,
  layout,
  shadows,

  // Animation durations (in milliseconds)
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
    slider: {
      show: 350,
      hide: 280,
    },
  },

  // Opacity values
  opacity: {
    disabled: 0.4,
    overlay: 0.5,
    pressed: 0.8,
    subtle: 0.1,
  },

  // Common measurements
  measurements: {
    cardWidth: '80%',
    sliderHeight: 0.7, // 70% of screen height
    dragThreshold: 0.3, // 30% for closing slider
  },
} as const;

export type Theme = typeof theme;

// Export individual modules for convenience
export { colors, spacing, typography, layout, shadows }; 