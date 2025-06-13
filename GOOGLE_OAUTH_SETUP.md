# Google OAuth Setup Guide

## Issues Fixed

1. ✅ **Invalid button width**: Removed `width="100%"` from GoogleLogin components and used proper CSS styling
2. ⚠️ **Origin not allowed**: Need to configure Google OAuth client settings

## Google OAuth Configuration

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"

### Step 2: Configure OAuth Client
1. Find your OAuth 2.0 Client ID: `546063441484-565u7vmohghbkbko0rsjve0sh76500f1.apps.googleusercontent.com`
2. Click on the client ID to edit it
3. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - `http://localhost:5173` (if using Vite dev server)
   - `https://yourdomain.com` (for production)

### Step 3: Environment Variables (Optional)
Create a `.env` file in the project root:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=546063441484-565u7vmohghbkbko0rsjve0sh76500f1.apps.googleusercontent.com

# Backend API URL
VITE_API_URL=https://localhost:7127
```

### Step 4: Verify Configuration
1. Make sure the Google+ API is enabled in your Google Cloud Console
2. Ensure the OAuth consent screen is configured
3. Test the sign-in functionality

## Common Issues

### "The given origin is not allowed for the given client ID"
- **Solution**: Add your current origin to the "Authorized JavaScript origins" in Google Cloud Console
- **Common origins to add**:
  - `http://localhost:3000`
  - `http://localhost:5173`
  - `https://localhost:3000` (if using HTTPS)

### "FedCM was disabled"
- This is a browser security feature
- Users can enable it via browser settings
- Not critical for functionality

### "Invalid button width"
- ✅ **Fixed**: Removed `width="100%"` from GoogleLogin components
- Now using proper CSS container styling

## Testing

1. Start your development server
2. Navigate to the sign-in page
3. Try clicking the Google Sign-In button
4. Check browser console for any remaining errors

## Production Deployment

When deploying to production:
1. Add your production domain to "Authorized JavaScript origins"
2. Update the OAuth consent screen with production URLs
3. Consider using environment variables for different environments 