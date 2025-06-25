/**
 * Spacing system based on 4px increments
 * Provides consistent spacing throughout the app
 */

export const spacing = {
  // Base spacing units (4px increments)
  xs: 4,      // 4px
  sm: 8,      // 8px  
  md: 12,     // 12px - current default
  lg: 16,     // 16px
  xl: 20,     // 20px - current header spacing
  xxl: 24,    // 24px
  xxxl: 32,   // 32px

  // Semantic spacing
  component: {
    padding: 12,        // Card content padding
    margin: 12,         // Card margins
    gap: 8,            // Gap between elements
  },

  layout: {
    headerTop: 80,      // Header top padding
    headerBottom: 10,   // Header bottom padding
    cardVertical: 12,   // Card vertical margins
    footerHeight: 20,   // Footer spacer
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  screen: {
    horizontal: 20,     // Screen edge padding
    vertical: 20,       // Screen top/bottom padding
  },
} as const;

export type Spacing = typeof spacing; 