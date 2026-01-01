/**
 * OAuth Configuration and Implementation
 * This file handles Google and Apple OAuth authentication flows
 */

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: window.location.origin + '/oauth-callback.html',
    scope: 'profile email'
  },
  apple: {
    clientId: 'YOUR_APPLE_CLIENT_ID',
    redirectUri: window.location.origin + '/oauth-callback.html',
    scope: 'name email'
  }
};

// Authentication State Manager
class AuthManager {
  constructor() {
    this.user = null;
    this.loadUser();
  }

  loadUser() {
    const userStr = localStorage.getItem('moon_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        localStorage.removeItem('moon_user');
      }
    }
  }

  saveUser(userData) {
    this.user = userData;
    localStorage.setItem('moon_user', JSON.stringify(userData));
    this.updateUI();
  }

  logout() {
    this.user = null;
    localStorage.removeItem('moon_user');
    localStorage.removeItem('moon_access_token');
    localStorage.removeItem('moon_token_expiry');
    this.updateUI();
    
    // Revoke Google token if available
    if (window.google && window.google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }

  updateUI() {
    if (this.isAuthenticated()) {
      this.showAuthenticatedUI();
    } else {
      this.showUnauthenticatedUI();
    }
  }

  showAuthenticatedUI() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions) return;

    const user = this.getUser();
    topActions.innerHTML = `
      <div class="user-menu">
        <button class="btn ghost topbar-btn" onclick="authManager.showProfile()">
          ${user.name || user.email}
        </button>
        <button class="btn ghost topbar-btn" onclick="authManager.logout()">Logout</button>
      </div>
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
        <span class="theme-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
      </button>
    `;
  }

  showUnauthenticatedUI() {
    const topActions = document.querySelector('.top-actions');
    if (!topActions) return;

    topActions.innerHTML = `
      <button class="btn ghost topbar-btn" onclick="handleLogin()">Log in</button>
      <button class="btn primary topbar-btn" onclick="handleSignup()">Sign up</button>
      <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
        <span class="theme-icon">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</span>
      </button>
    `;
  }

  showProfile() {
    const user = this.getUser();
    if (!user) return;

    let profileInfo = `Name: ${user.name || 'N/A'}\nEmail: ${user.email || 'N/A'}`;
    if (user.picture) {
      profileInfo += `\nProfile Picture: Available`;
    }
    alert(`User Profile\n\n${profileInfo}\n\nIn a production app, this would show a proper profile page.`);
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Google OAuth Implementation
function initGoogleOAuth() {
  if (!window.google || !window.google.accounts) {
    console.warn('Google Identity Services not loaded yet');
    return;
  }

  google.accounts.id.initialize({
    client_id: OAUTH_CONFIG.google.clientId,
    callback: handleGoogleCallback,
    auto_select: false,
    cancel_on_tap_outside: true
  });
}

function handleGoogleCallback(response) {
  try {
    // Decode JWT token to get user info
    const userInfo = parseJwt(response.credential);
    
    const userData = {
      provider: 'google',
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      token: response.credential,
      tokenExpiry: Date.now() + 3600000 // 1 hour
    };

    authManager.saveUser(userData);
    showNotification('Successfully signed in with Google!', 'success');
  } catch (error) {
    console.error('Google sign-in error:', error);
    showNotification('Failed to sign in with Google. Please try again.', 'error');
  }
}

function continueWithGoogle() {
  // Check if Google Identity Services is loaded
  if (!window.google || !window.google.accounts) {
    showNotification('Google Sign-In is loading. Please try again in a moment.', 'warning');
    return;
  }

  // Check if client ID is configured
  if (OAUTH_CONFIG.google.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    showNotification(
      'Google OAuth is not configured yet.\n\nPlease set up:\n1. Create a Google Cloud project\n2. Enable Google Sign-In API\n3. Create OAuth 2.0 credentials\n4. Update OAUTH_CONFIG.google.clientId in oauth-config.js',
      'warning'
    );
    return;
  }

  // Prompt user to sign in
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback to One Tap UI didn't show, try button flow
      showGoogleSignInButton();
    }
  });
}

function showGoogleSignInButton() {
  const existingButton = document.getElementById('google-signin-button');
  if (existingButton) {
    existingButton.remove();
  }

  const buttonDiv = document.createElement('div');
  buttonDiv.id = 'google-signin-button';
  buttonDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3000;';
  
  document.body.appendChild(buttonDiv);
  
  google.accounts.id.renderButton(
    buttonDiv,
    {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 250
    }
  );
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'google-signin-backdrop';
  backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2999;';
  backdrop.onclick = () => {
    backdrop.remove();
    buttonDiv.remove();
  };
  document.body.appendChild(backdrop);
}

// Apple OAuth Implementation
function continueWithApple() {
  // Check if Apple Sign In is configured
  if (OAUTH_CONFIG.apple.clientId === 'YOUR_APPLE_CLIENT_ID') {
    showNotification(
      'Apple Sign In is not configured yet.\n\nPlease set up:\n1. Create an App ID in Apple Developer Portal\n2. Enable Sign in with Apple capability\n3. Create a Service ID\n4. Configure domains and redirect URLs\n5. Update OAUTH_CONFIG.apple.clientId in oauth-config.js',
      'warning'
    );
    return;
  }

  // Check if AppleID is loaded
  if (!window.AppleID) {
    showNotification('Apple Sign In SDK is loading. Please try again in a moment.', 'warning');
    return;
  }

  try {
    AppleID.auth.init({
      clientId: OAUTH_CONFIG.apple.clientId,
      scope: OAUTH_CONFIG.apple.scope,
      redirectURI: OAUTH_CONFIG.apple.redirectUri,
      usePopup: true
    });

    AppleID.auth.signIn();
  } catch (error) {
    console.error('Apple sign-in error:', error);
    showNotification('Failed to initialize Apple Sign In. Please try again.', 'error');
  }
}

// Listen for Apple Sign In events
document.addEventListener('AppleIDSignInOnSuccess', (event) => {
  try {
    const { authorization, user } = event.detail;
    
    const userData = {
      provider: 'apple',
      id: authorization.id_token ? parseJwt(authorization.id_token).sub : 'apple_user',
      email: user?.email || 'No email provided',
      name: user?.name ? `${user.name.firstName} ${user.name.lastName}` : 'Apple User',
      token: authorization.code,
      tokenExpiry: Date.now() + 3600000 // 1 hour
    };

    authManager.saveUser(userData);
    showNotification('Successfully signed in with Apple!', 'success');
  } catch (error) {
    console.error('Apple sign-in success handler error:', error);
    showNotification('Signed in with Apple, but failed to process user data.', 'warning');
  }
});

document.addEventListener('AppleIDSignInOnFailure', (event) => {
  console.error('Apple sign-in failed:', event.detail);
  showNotification('Failed to sign in with Apple. Please try again.', 'error');
});

// Email Magic Link (Enhanced)
function continueWithEmail() {
  const email = prompt('Enter your email address:');
  if (!email) return;
  
  // Basic email validation with proper regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address.', 'error');
    return;
  }

  // Simulate sending magic link
  showNotification(
    `Magic link sent to ${email}!\n\nCheck your inbox and click the link to sign in.\n\n(This is a demo - in production, this would send a real authentication email)`,
    'success'
  );
  
  // In production, this would make an API call:
  // fetch('/api/auth/magic-link', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email })
  // });
}

// Utility Functions
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return {};
  }
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.auth-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `auth-notification auth-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    font-size: 14px;
    font-weight: 500;
    white-space: pre-line;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  .user-menu {
    display: flex;
    gap: 16px;
    align-items: center;
  }
`;
document.head.appendChild(style);

// Initialize OAuth on page load
window.addEventListener('load', () => {
  // Initialize Google OAuth when both window.google and google.accounts are available
  const checkGoogle = setInterval(() => {
    if (window.google && window.google.accounts) {
      initGoogleOAuth();
      clearInterval(checkGoogle);
    }
  }, 100);
  
  // Stop checking after 10 seconds
  setTimeout(() => clearInterval(checkGoogle), 10000);
  
  // Update UI based on auth state
  authManager.updateUI();
});
