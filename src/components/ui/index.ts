/**
 * UI Components Index
 * 
 * MANDATORY: Import design system components from here
 * These components enforce consistency across the app
 */

// Design System Core Components - ALWAYS use these
export { ScreenLayout } from './ScreenLayout';
export { Typography } from './Typography';
export { Spacer } from './Spacer';

// Existing UI Components
export { RestaurantDetail } from './RestaurantDetail';
export { RestaurantSlider } from './RestaurantSlider';
export { StarRating } from './StarRating';
export { StarRatingDemo } from './StarRatingDemo';

/**
 * IMPORT PATTERN:
 * 
 * // In any screen or component file:
 * import { ScreenLayout, Typography, Spacer } from '../components/ui';
 * import { componentStyles } from '../styles/componentStyles';
 * 
 * // Then use in your JSX:
 * <ScreenLayout>
 *   <Typography variant="h1">Title</Typography>
 *   <Spacer size="lg" />
 *   // ... rest of content
 * </ScreenLayout>
 */ 