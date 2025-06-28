/**
 * Styles Index
 * Central export point for all styling and design system elements
 */

// Core theme system (existing)
export { theme, colors, spacing, typography, layout, shadows } from './theme';
export { globalStyles } from './globalStyles';

// Design System Components (new)
export { componentStyles } from './componentStyles';
export { DESIGN_SYSTEM_RULES, COMPONENT_GUIDELINES, VALIDATION_CHECKLIST } from './styleGuide';

/**
 * IMPORT PATTERNS:
 * 
 * // For theme values:
 * import { theme } from '../styles';
 * 
 * // For component styles:
 * import { componentStyles } from '../styles';
 * 
 * // For design system rules (AI reference):
 * import { DESIGN_SYSTEM_RULES } from '../styles';
 */

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