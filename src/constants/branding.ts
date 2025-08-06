// Branding constants for Gyld app
export const BRANDING = {
  // Company logo for push notifications
  // You'll need to host this image on a public URL (CDN, your website, etc.)
  PUSH_NOTIFICATION_LOGO: 'https://your-domain.com/assets/gyld-logo.png',
  
  // Alternative: Use a base64 encoded version for small images
  // PUSH_NOTIFICATION_LOGO: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  
  // App branding colors
  COLORS: {
    PRIMARY: '#13BEC7', // Teal from your logo
    SECONDARY: '#0A9BA3',
    WHITE: '#FFFFFF'
  },
  
  // Company info
  COMPANY: {
    NAME: 'Gyld',
    DISPLAY_NAME: 'Gyld',
    TAGLINE: 'Connect, Learn, Grow'
  }
} as const;

// Helper function to get the logo URL for push notifications
export function getPushNotificationLogo(): string {
  return BRANDING.PUSH_NOTIFICATION_LOGO;
}

// Helper function to check if we should include logo in push notifications
export function shouldIncludePushLogo(): boolean {
  // Only include logo if we have a valid URL
  return BRANDING.PUSH_NOTIFICATION_LOGO.startsWith('http') || 
         BRANDING.PUSH_NOTIFICATION_LOGO.startsWith('data:');
} 