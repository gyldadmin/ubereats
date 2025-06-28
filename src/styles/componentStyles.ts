/**
 * Component Style Templates
 * Pre-made, approved styles for common layout patterns
 * 
 * MANDATORY: Use these styles instead of creating custom StyleSheet objects
 * These templates ensure consistency across all screens and components
 */

import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const componentStyles = StyleSheet.create({
  // SCREEN CONTAINERS - Use these in every screen
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingVertical: theme.spacing.screen.vertical,
  },

  screenWithHeader: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.layout.components.header.paddingTop,
    paddingHorizontal: theme.spacing.screen.horizontal,
    paddingBottom: theme.spacing.screen.vertical,
  },

  screenCentered: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.screen.horizontal,
  },

  screenFullBleed: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    // No padding - for special screens that need full width
  },

  // CONTENT SECTIONS
  section: {
    marginBottom: theme.spacing.xxl,
  },

  sectionHeader: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },

  sectionSubheader: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },

  // FORM ELEMENTS
  formGroup: {
    marginBottom: theme.spacing.lg,
  },

  formLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  formHelperText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },

  formErrorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
  },

  // CARDS AND CONTAINERS
  standardCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },

  listCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },

  // LIST ITEMS
  listItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
  },

  listItemFirst: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.layout.borderRadius.md,
    borderTopRightRadius: theme.layout.borderRadius.md,
  },

  listItemLast: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderBottomLeftRadius: theme.layout.borderRadius.md,
    borderBottomRightRadius: theme.layout.borderRadius.md,
  },

  // CONTENT AREAS
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },

  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },

  // BUTTON CONTAINERS
  buttonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },

  // LOADING AND EMPTY STATES
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.xl,
  },

  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },

  // HEADER STYLES
  headerContainer: {
    paddingHorizontal: theme.layout.components.header.paddingHorizontal,
    paddingTop: theme.layout.components.header.paddingTop,
    paddingBottom: theme.layout.components.header.paddingBottom,
    backgroundColor: theme.colors.background.primary,
  },

  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },

  headerSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
});

export type ComponentStyles = typeof componentStyles; 