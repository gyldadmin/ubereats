/**
 * Color palette for Uber Eats app
 * Main brand color: #13bec7 (teal/cyan)
 */

export const colors = {
  // Brand colors
  primary: '#13bec7',
  primaryLight: '#4dd0d7',
  primaryLighter: '#7dd3d9',      // Even lighter shade for sub-tabs
  primaryDark: '#0e9ba1',
  primaryAlpha: 'rgba(19, 190, 199, 0.1)',
  primarySoft: 'rgba(19, 190, 199, 0.15)',  // Soft background for selected tabs

  // Background colors
  background: {
    primary: '#f8f5f0',      // Current cream background
    secondary: '#ffffff',     // White surface
    tertiary: '#f5f5f5',     // Light gray
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#333333',       // Dark gray - main text
    secondary: '#666666',     // Medium gray - subtitles
    tertiary: '#999999',      // Light gray - placeholders
    quaternary: '#777777',    // Address text
    inverse: '#ffffff',       // White text on dark backgrounds
  },

  // Status colors
  status: {
    success: '#4CAF50',       // Green
    error: '#d32f2f',         // Red
    warning: '#FF9800',       // Orange
    info: '#2196F3',          // Blue
  },

  // Interactive colors
  interactive: {
    like: '#FF6B6B',          // Heart/like button
    likeInactive: '#999999',  // Inactive like button
    link: '#13bec7',          // Links use brand color
    disabled: '#cccccc',      // Disabled state
  },

  // Border and shadow colors
  border: {
    light: '#e0e0e0',
    medium: '#d1d5db',
    dark: '#9ca3af',
  },

  shadow: '#000000',

  // Transparent variations
  transparent: {
    white: 'rgba(255, 255, 255, 0.9)',
    black: 'rgba(0, 0, 0, 0.1)',
    primary: 'rgba(19, 190, 199, 0.1)',
  },
} as const;

export type Colors = typeof colors; 