/**
 * Global reusable styles
 * Common component styles that can be imported and used
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, layout, shadows } from './theme';

export const globalStyles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },

  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: spacing.xl,
  },

  // Typography styles
  h1: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
  },

  h2: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.xxl * typography.lineHeights.tight,
    marginBottom: spacing.xs,
  },

  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
  },

  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },

  body: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },

  caption: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.normal,
    color: colors.text.tertiary,
  },

  // Card styles
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: layout.borderRadius.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },

  cardContent: {
    padding: spacing.md,
  },

  // Button styles
  button: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: spacing.button.paddingHorizontal,
    paddingVertical: spacing.button.paddingVertical,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: layout.components.button.height,
    ...shadows.button.default,
  },

  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  buttonSecondary: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },

  buttonSecondaryText: {
    color: colors.primary,
  },

  buttonDisabled: {
    backgroundColor: colors.interactive.disabled,
    ...shadows.none,
  },

  buttonDisabledText: {
    color: colors.text.tertiary,
  },

  // Link styles
  link: {
    color: colors.interactive.link,
    textDecorationLine: 'underline',
  },

  linkPressed: {
    opacity: 0.7,
  },

  // Input styles
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: 6, // Reduced from 10 to 6
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    minHeight: layout.components.input.height,
  },

  inputFocused: {
    borderColor: colors.primary,
    ...shadows.sm,
  },

  inputError: {
    borderColor: colors.status.error,
  },

  // Header styles
  header: {
    paddingHorizontal: layout.components.header.paddingHorizontal,
    paddingTop: layout.components.header.paddingTop,
    paddingBottom: layout.components.header.paddingBottom,
  },

  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },

  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },

  // List styles
  listContainer: {
    paddingTop: spacing.md,
  },

  listItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  // Status styles
  errorText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  errorDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },

  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  emptyDetail: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // Utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    justifyContent: 'space-between',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  flex1: {
    flex: 1,
  },

  // Spacing utilities
  marginTopSm: { marginTop: spacing.sm },
  marginTopMd: { marginTop: spacing.md },
  marginTopLg: { marginTop: spacing.lg },
  marginBottomSm: { marginBottom: spacing.sm },
  marginBottomMd: { marginBottom: spacing.md },
  marginBottomLg: { marginBottom: spacing.lg },

  paddingHorizontalSm: { paddingHorizontal: spacing.sm },
  paddingHorizontalMd: { paddingHorizontal: spacing.md },
  paddingHorizontalLg: { paddingHorizontal: spacing.lg },
  paddingVerticalSm: { paddingVertical: spacing.sm },
  paddingVerticalMd: { paddingVertical: spacing.md },
  paddingVerticalLg: { paddingVertical: spacing.lg },
});

export type GlobalStyles = typeof globalStyles; 