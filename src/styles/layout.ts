/**
 * Layout constants and dimensions
 * Screen dimensions, component sizes, etc.
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const layout = {
  // Screen dimensions
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Border radius
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 15,        // Current card radius
    xl: 20,        // Slider radius
    xxl: 24,
    round: 50,     // Circular elements
  },

  // Component dimensions
  components: {
    // Restaurant card
    card: {
      width: '80%',
      imageHeight: 144,
      borderRadius: 15,
    },

    // Like button
    likeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },

    // Header
    header: {
      paddingTop: 80,
      paddingBottom: 10,
      paddingHorizontal: 20,
    },

    // Slider
    slider: {
      heightPercentage: 0.7,
      borderRadius: 20,
      dragBarWidth: 40,
      dragBarHeight: 4,
      headerHeight: 40,
    },

    // Buttons
    button: {
      height: 44,
      borderRadius: 12,
      minWidth: 120,
    },

    // Input fields
    input: {
      height: 48,
      borderRadius: 8,
    },
  },

  // Elevation/Shadow levels
  elevation: {
    none: 0,
    sm: 3,
    md: 5,         // Current card elevation
    lg: 8,
    xl: 10,        // Slider elevation
  },

  // Z-index levels
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

export type Layout = typeof layout; 