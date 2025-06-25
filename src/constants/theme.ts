// Brand colors
export const BRAND_COLOR = '#13bec7'; // Brand teal color

// Additional theme constants
export const COLORS = {
  brand: BRAND_COLOR,
  primary: BRAND_COLOR,
  secondary: 'gray',
  background: '#fff',
  text: '#000',
  textSecondary: 'gray',
} as const;

export const THEME = {
  colors: COLORS,
} as const; 