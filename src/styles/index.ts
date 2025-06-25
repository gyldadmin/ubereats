/**
 * Main styles export file
 * Import everything you need from here
 */

// Export theme and individual modules
export { theme, colors, spacing, typography, layout, shadows } from './theme';

// Export global styles
export { globalStyles } from './globalStyles';

// Export types
export type { Theme } from './theme';
export type { Colors } from './colors';
export type { Spacing } from './spacing';
export type { Typography } from './typography';
export type { Layout } from './layout';
export type { Shadows } from './shadows';
export type { GlobalStyles } from './globalStyles';

// Convenience re-exports for commonly used items
import { colors as colorsImport, spacing as spacingImport } from './theme';

export const {
  primary,
  background,
  text,
  status,
  interactive,
} = colorsImport;

export const {
  xs,
  sm,
  md,
  lg,
  xl,
} = spacingImport; 