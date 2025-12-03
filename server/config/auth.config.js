// Authentication configuration
module.exports = {
  // JWT secrets - in production, use environment variables
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-in-production',
  
  // Token expiration times
  jwtExpiration: '1h', // Access token expires in 1 hour
  jwtRefreshExpiration: '7d', // Refresh token expires in 7 days
  
  // Password requirements
  passwordMinLength: 6,
  
  // User validation
  usernameMinLength: 3,
  usernameMaxLength: 20,
  handleMinLength: 3,
  handleMaxLength: 20,
  
  // OAuth Providers (configured in Firebase Console)
  // - Google: Enable in Firebase Console > Authentication > Sign-in method
  // - GitHub: Enable and add OAuth credentials from GitHub Developer Settings
  oauthProviders: ['google', 'github'],
};

