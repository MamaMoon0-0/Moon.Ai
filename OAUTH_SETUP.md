# Moon.ai OAuth Setup Guide

This guide explains how to configure and use OAuth authentication (Google and Apple Sign-In) in Moon.ai.

## Overview

Moon.ai now supports three authentication methods:
- **Google OAuth 2.0** - Sign in with Google
- **Apple Sign In** - Sign in with Apple ID
- **Email Magic Link** - Password-less email authentication (demo)

## Features

✅ **Multiple OAuth Providers**: Google and Apple Sign-In integration
✅ **Session Management**: Persistent user sessions with localStorage
✅ **Responsive UI**: Dynamic UI updates based on authentication state
✅ **Token Management**: Secure token storage and expiry handling
✅ **User Profile**: Display user information after authentication
✅ **Logout Functionality**: Clean session termination
✅ **Error Handling**: Comprehensive error messages and user feedback

## Setup Instructions

### Google OAuth Configuration

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sign-In API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost` (for local testing)
     - `https://yourdomain.com` (your production domain)
   - Add authorized redirect URIs:
     - `http://localhost/oauth-callback.html`
     - `https://yourdomain.com/oauth-callback.html`
   - Copy the Client ID

4. **Update Configuration**
   - Open `oauth-config.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:
   ```javascript
   const OAUTH_CONFIG = {
     google: {
       clientId: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
       redirectUri: window.location.origin + '/oauth-callback.html',
       scope: 'profile email'
     },
     // ...
   };
   ```

### Apple Sign In Configuration

1. **Create an App ID**
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to "Certificates, Identifiers & Profiles"
   - Click on "Identifiers" > "+" to create a new App ID
   - Enable "Sign in with Apple" capability

2. **Create a Services ID**
   - Click on "Identifiers" > "+"
   - Select "Services IDs" and continue
   - Enter a description and identifier (this will be your Client ID)
   - Enable "Sign in with Apple"
   - Configure:
     - Primary App ID: Select your App ID from step 1
     - Domains and Subdomains: Add your domain (e.g., `yourdomain.com`)
     - Return URLs: Add `https://yourdomain.com/oauth-callback.html`

3. **Update Configuration**
   - Open `oauth-config.js`
   - Replace `YOUR_APPLE_CLIENT_ID` with your Services ID:
   ```javascript
   const OAUTH_CONFIG = {
     // ...
     apple: {
       clientId: 'com.yourdomain.services',
       redirectUri: window.location.origin + '/oauth-callback.html',
       scope: 'name email'
     }
   };
   ```

## File Structure

```
Moon.Ai/
├── index.html              # Main application page
├── oauth-config.js         # OAuth configuration and authentication logic
├── oauth-callback.html     # OAuth redirect callback handler
├── styles.css             # Application styles
├── about.html             # About page
├── privacy.html           # Privacy policy
├── terms.html             # Terms of service
└── OAUTH_SETUP.md         # This documentation
```

## How It Works

### Authentication Flow

1. **User Initiates Sign-In**
   - User clicks "Continue with Google" or "Continue with Apple"
   - OAuth provider's sign-in window appears

2. **OAuth Provider Authentication**
   - User authenticates with their Google or Apple account
   - OAuth provider redirects back to `oauth-callback.html`

3. **Token Processing**
   - Callback page receives authorization code or tokens
   - User information is extracted and stored in localStorage
   - User is redirected back to the main page

4. **Session Management**
   - User data persists across page reloads
   - UI automatically updates to show authenticated state
   - Logout clears all stored session data

### Key Components

#### AuthManager Class
Manages authentication state and user sessions:
- `saveUser(userData)` - Stores user information
- `logout()` - Clears session and revokes tokens
- `isAuthenticated()` - Checks if user is logged in
- `updateUI()` - Updates interface based on auth state

#### OAuth Functions
- `continueWithGoogle()` - Initiates Google Sign-In
- `continueWithApple()` - Initiates Apple Sign-In
- `continueWithEmail()` - Demo magic link flow
- `handleGoogleCallback()` - Processes Google authentication
- Apple events handled via DOM events

## Testing

### Local Testing

1. **Start a local web server**:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

2. **Access the application**:
   - Open `http://localhost:8000/index.html`

3. **Test OAuth flows**:
   - Click "Continue with Google" or "Continue with Apple"
   - If not configured, you'll see helpful setup instructions
   - If configured, OAuth flow will initiate

### Production Deployment

1. Deploy files to your web server or hosting platform
2. Ensure HTTPS is enabled (required for OAuth)
3. Update OAuth provider configurations with production URLs
4. Test all authentication flows

## Security Considerations

⚠️ **Important Security Notes**:

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **Token Storage**: Tokens are stored in localStorage (consider more secure options for sensitive data)
3. **Token Expiry**: Tokens expire after 1 hour (implement refresh logic for production)
4. **Client-Side Only**: This is a client-side implementation; consider server-side verification for production
5. **Domain Restrictions**: Configure authorized domains carefully in OAuth provider settings

## Customization

### Changing Token Expiry
Edit `oauth-config.js`:
```javascript
tokenExpiry: Date.now() + 3600000 // 1 hour in milliseconds
```

### Modifying OAuth Scopes
Edit the scope in `OAUTH_CONFIG`:
```javascript
google: {
  scope: 'profile email openid' // Add more scopes as needed
}
```

### Styling Notifications
Notifications can be styled by modifying the `showNotification()` function in `oauth-config.js`.

## Troubleshooting

### "Google Sign-In is loading..."
- Ensure Google Identity Services script is loaded
- Check browser console for errors
- Verify Client ID is correct

### "Redirect URI mismatch"
- Ensure the redirect URI in OAuth provider settings matches exactly
- Include both HTTP (for local) and HTTPS (for production) variants
- Don't forget `/oauth-callback.html` at the end

### "Invalid Client ID"
- Verify Client ID is correctly copied
- Ensure you're using the Client ID, not the Client Secret
- Check that the API is enabled in your provider console

### User Data Not Persisting
- Check browser localStorage is enabled
- Verify localStorage isn't being cleared by browser settings
- Check browser console for errors

## API Reference

### AuthManager Methods

```javascript
// Check if user is authenticated
authManager.isAuthenticated() // Returns: boolean

// Get current user
authManager.getUser() // Returns: object | null

// Logout user
authManager.logout()

// Show user profile
authManager.showProfile()
```

### OAuth Functions

```javascript
// Initiate Google Sign-In
continueWithGoogle()

// Initiate Apple Sign-In
continueWithApple()

// Email magic link (demo)
continueWithEmail()
```

## Support

For questions or issues:
- Email: hello@moon.ai
- Check browser console for error messages
- Review OAuth provider documentation:
  - [Google Identity Services](https://developers.google.com/identity/gsi/web)
  - [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)

## License

Part of Moon.ai project. See main repository for license information.
