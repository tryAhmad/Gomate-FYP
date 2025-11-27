# Google Maps API Setup for Admin Portal

This document explains how to set up the Google Maps Geocoding API for the admin portal to display human-readable addresses in ride details.

## Prerequisites

You need a Google Cloud Platform account and a project with the Geocoding API enabled.

## Steps to Get Your API Key

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"

### 2. Enable the Geocoding API
1. Search for "Geocoding API"
2. Click on it and press "Enable"

### 3. Create API Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your new API key

### 4. Restrict Your API Key (Recommended)
For security, restrict your API key:
1. Click on your API key in the credentials list
2. Under "Application restrictions", select "HTTP referrers (websites)"
3. Add your domains (e.g., `localhost:3001`, your production domain)
4. Under "API restrictions", select "Restrict key"
5. Choose "Geocoding API" from the dropdown
6. Save your changes

### 5. Add to Environment Variables
1. Open `gomate-admin/.env.local`
2. Replace `your_google_maps_api_key_here` with your actual API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...your-key-here
   ```

## Usage

The geocoding utility is automatically used in the Ride Details modal:
- Converts pickup/dropoff coordinates to addresses
- Shows loading state while fetching
- Falls back to coordinates if API fails or is not configured
- Displays both address and coordinates for reference

## API Costs

Google Maps Geocoding API pricing (as of 2024):
- Free tier: $200 credit per month (≈ 40,000 requests)
- After free tier: $5 per 1,000 requests
- Monitor usage in Google Cloud Console

## Troubleshooting

### "API key is not configured" error
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Restart the Next.js dev server after adding the key

### "Geocoding failed" errors
- Verify the API key is correct
- Check that the Geocoding API is enabled in Google Cloud Console
- Verify API key restrictions allow requests from your domain
- Check the browser console for detailed error messages

### Coordinates show instead of addresses
- This is normal fallback behavior if:
  - API key is not configured
  - API request fails
  - No address found for coordinates

## Files Involved

- `.env.local` - Environment configuration
- `lib/geocoding.ts` - Reverse geocoding utility functions
- `components/rides/ride-details-modal.tsx` - Uses geocoding to display addresses

## Security Notes

- Never commit your API key to version control
- `.env.local` is already in `.gitignore`
- Use API key restrictions to prevent unauthorized usage
- Monitor API usage regularly in Google Cloud Console
