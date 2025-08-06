# Hosting Your Company Logo for Push Notifications

To display your company logo in push notifications, you need to host the image at a publicly accessible URL.

## Quick Setup Options

### Option 1: Use GitHub (Free & Easy)
1. Create a public GitHub repository or use your existing one
2. Upload `gyld-logo.png` to the repository
3. Get the raw file URL: `https://raw.githubusercontent.com/username/repo/main/assets/gyld-logo.png`
4. Update `src/constants/branding.ts` with this URL

### Option 2: Use Cloudinary (Free tier available)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Upload your logo
3. Copy the public URL (e.g., `https://res.cloudinary.com/your-cloud/image/upload/v1234567890/gyld-logo.png`)
4. Update `src/constants/branding.ts` with this URL

### Option 3: Use Your Website
1. Upload the logo to your website's assets folder
2. Make sure it's publicly accessible (e.g., `https://yourwebsite.com/assets/gyld-logo.png`)
3. Update `src/constants/branding.ts` with this URL

### Option 4: Base64 Encoding (For Small Images)
If your logo is small (< 50KB), you can embed it directly:
1. Convert your image to base64 using an online tool
2. Update the `PUSH_NOTIFICATION_LOGO` in `src/constants/branding.ts` to:
   ```typescript
   PUSH_NOTIFICATION_LOGO: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
   ```

## Image Requirements
- **Format**: PNG, JPG, or GIF
- **Size**: Recommended 512x512px or smaller
- **File size**: Under 1MB for best performance
- **Aspect ratio**: Square (1:1) works best for most platforms

## Testing
After updating the URL, test your push notifications to ensure the logo appears correctly on both iOS and Android devices.

## Current Configuration
Update the `PUSH_NOTIFICATION_LOGO` value in `src/constants/branding.ts` with your chosen hosting URL. 