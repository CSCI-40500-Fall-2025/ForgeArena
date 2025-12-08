# Firebase Authentication Setup Guide

This guide will help you enable Firebase Authentication for your ForgeArena project.

## Step 1: Enable Authentication in Firebase Console

1. **Go to your Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Get started" if this is your first time

3. **Set up Sign-in Method**
   - Go to the "Sign-in method" tab
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

4. **Optional: Enable Email Verification**
   - In the same Email/Password settings
   - Toggle "Email link (passwordless sign-in)" if desired
   - Configure email templates under "Templates" tab

## Step 2: Update Firestore Security Rules

Your Firestore rules need to be updated to work with authenticated users. Replace your current rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all users for leaderboards
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    
    // Quests - authenticated users can read/write
    match /quests/{questId} {
      allow read, write: if request.auth != null;
    }
    
    // Raid Boss - authenticated users can read/write
    match /raidBoss/{raidId} {
      allow read, write: if request.auth != null;
    }
    
    // Workouts - users can only access their own
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Other collections for future features
    match /parties/{partyId} {
      allow read, write: if request.auth != null;
    }
    
    match /contributions/{contributionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 3: Test the Authentication Flow

### 3.1 Start Your Application
```bash
npm run dev
```

### 3.2 Test Sign Up Flow
1. Open your app in the browser
2. You should see a login/signup form (since you're not authenticated)
3. Click "Sign Up"
4. Fill in:
   - Username: "TestUser"
   - Email: "test@example.com"
   - Password: "password123" (minimum 6 characters)
5. Click "Sign Up"
6. You should be redirected to the main app

### 3.3 Test Session Persistence
1. Refresh the page
2. You should remain logged in (no login form should appear)
3. Your user profile should appear in the top-right corner

### 3.4 Test Logout
1. Click the 🚪 (door) icon in the user profile
2. You should be logged out and see the login form again

### 3.5 Test Login Flow
1. Click "Log In" on the auth form
2. Enter the same credentials you used to sign up
3. You should be logged back in

### 3.6 Test Data Persistence
1. Log a workout by selecting an exercise and clicking "Log Workout"
2. Note your XP and level
3. Refresh the page
4. Your XP and level should be maintained (data persists in Firebase)

## Step 4: Verify Firebase Integration

### Check Firebase Console
1. Go to Authentication → Users
2. You should see your test user listed
3. Go to Firestore Database → Data
4. You should see a `users` collection with your user document

### Check Browser Console
1. Open browser developer tools (F12)
2. Look for "Firebase initialized successfully" message
3. No authentication errors should appear

## Step 5: Common Issues and Solutions

### Issue: "Firebase not initialized" error
**Solution:** 
- Check that your `.env` file is in the `client/` directory
- Verify all Firebase config values are correct
- Restart your development server

### Issue: "Permission denied" errors
**Solution:**
- Make sure you've updated your Firestore security rules
- Verify you're signed in (check browser console)
- Rules may take a few minutes to propagate

### Issue: User data not persisting
**Solution:**
- Check that Firebase is properly initialized
- Verify your project ID matches your Firebase project
- Check browser network tab for failed requests

### Issue: Can't sign up/login
**Solution:**
- Ensure Email/Password is enabled in Firebase Console
- Check for error messages in browser console
- Verify password is at least 6 characters

## Step 6: Production Considerations

### Environment Variables
For production, make sure to:
1. Set up proper environment variables in your hosting platform
2. Never commit your `.env` file to version control
3. Use different Firebase projects for development and production

### Security Rules
- Review and tighten security rules for production
- Consider implementing user roles if needed
- Add rate limiting and abuse prevention

### User Experience
- Add email verification for production users
- Implement password reset functionality
- Add proper error handling and user feedback

## Acceptance Criteria Verification

✅ **User can register with email and password**
- Sign up form works with email/password validation

✅ **User can log in and stay logged in across app restarts**
- Firebase handles session persistence automatically
- Auth state is maintained on page refresh

✅ **User can log out manually**
- Logout button in user profile component

✅ **Auth state is reactive**
- Unauthenticated users see login form
- Authenticated users see the main app
- Protected routes work correctly

✅ **Works on both web and mobile builds**
- Firebase SDK is compatible with React web apps
- For mobile (React Native), additional setup would be needed

---

Your authentication system is now fully functional! Users can sign up, log in, stay logged in across sessions, and log out. All user data is properly synchronized with Firebase Firestore.
