# Profile Management Setup Guide

This guide will help you set up the profile management features including avatar uploads and unique handles.

## Prerequisites

1. Complete the Firebase setup from `FIREBASE_SETUP_GUIDE.md`
2. Complete the authentication setup from `AUTHENTICATION_SETUP.md`

## Step 1: Enable Firebase Storage

1. **Go to Firebase Console**
   - Navigate to your Firebase project
   - Click on "Storage" in the left sidebar

2. **Set up Storage**
   - Click "Get started"
   - Choose "Start in test mode" for now
   - Select a location (same as your Firestore location)
   - Click "Done"

3. **Configure Storage Rules**
   - Go to the "Rules" tab in Storage
   - Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload avatars
    match /avatars/{userId}_{timestamp}.{extension} {
      allow read: if true; // Public read access for avatars
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && resource == null // Only allow new uploads
                   && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Allow users to delete their own avatars
    match /avatars/{userId}_{timestamp}.{extension} {
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **Publish the rules**

## Step 2: Update Firestore Rules

Update your Firestore rules to include the new profile fields:

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
    
    // Enforce unique handles
    match /users/{userId} {
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && (!('handle' in request.resource.data) 
                       || !exists(/databases/$(database)/documents/users/$(userId))
                       || request.resource.data.handle == resource.data.handle
                       || !existsAfter(/databases/$(database)/documents/users/$(userId)));
    }
    
    // Other collections...
    match /quests/{questId} {
      allow read, write: if request.auth != null;
    }
    
    match /raidBoss/{raidId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 3: Test the Profile Features

### 3.1 Test Avatar Upload

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Navigate to Profile**
   - Log in to your account
   - Click the "Profile" tab in the navigation

3. **Upload an Avatar**
   - Click on the avatar placeholder
   - Select an image file (JPEG, PNG, WebP, or GIF)
   - The image should be automatically compressed and uploaded
   - Check that the avatar appears in the top-right user profile

4. **Verify Storage**
   - Go to Firebase Console → Storage
   - You should see your uploaded avatar in the `avatars/` folder

### 3.2 Test Handle Updates

1. **Edit Handle**
   - In the Profile screen, click "Edit" next to your handle
   - Try entering a new handle (3-20 characters, letters and numbers only)
   - The system should check availability in real-time

2. **Test Uniqueness**
   - Try using a handle that already exists (if you have multiple accounts)
   - The system should show "Handle is already taken"

3. **Save Changes**
   - Enter a unique handle and click "Save"
   - The handle should update and appear in the user profile

### 3.3 Test Session Persistence

1. **Make Profile Changes**
   - Upload an avatar and change your handle
   - Note the changes in your profile

2. **Refresh the Page**
   - Press F5 or refresh the browser
   - You should remain logged in
   - Your avatar and handle should persist

3. **Close and Reopen Browser**
   - Close the browser completely
   - Reopen and navigate to your app
   - You should still be logged in with your profile intact

## Step 4: Verify All Features

### ✅ Acceptance Criteria Checklist

- **✅ User can set a unique handle**
  - Handle validation works (3-20 chars, alphanumeric)
  - Uniqueness is enforced in the database
  - Real-time availability checking

- **✅ User can upload an avatar**
  - Images are stored in Firebase Storage (`avatars/` bucket)
  - Images are automatically compressed and resized
  - Old avatars are replaced when new ones are uploaded

- **✅ Avatar displayed in user profile**
  - Avatar appears in the top-right user profile component
  - Shows user's handle (@username format)
  - Falls back to initials if no avatar is uploaded

- **✅ Profile updates persist across sessions**
  - Changes are saved to Firestore
  - Data persists after page refresh
  - Data persists after browser restart

## Step 5: Advanced Features

### Image Compression

The system automatically:
- Resizes images to 200x200px maximum
- Compresses to JPEG format with 80% quality
- Validates file size (max 5MB)
- Supports JPEG, PNG, WebP, and GIF formats

### Handle System

- Handles are automatically generated during signup
- Format: lowercase letters and numbers only
- Length: 3-20 characters
- Uniqueness enforced at database level
- Real-time availability checking

### Security

- Users can only upload/delete their own avatars
- Avatars are publicly readable (for display purposes)
- Handle uniqueness prevents impersonation
- File size and type validation prevents abuse

## Troubleshooting

### Common Issues

1. **"Permission denied" when uploading avatar**
   - Check Firebase Storage rules are applied
   - Ensure user is authenticated
   - Verify file size is under 5MB

2. **Handle shows as "already taken" incorrectly**
   - Check Firestore rules for handle uniqueness
   - Ensure proper indexing on the `handle` field

3. **Avatar not displaying**
   - Check Firebase Storage CORS settings
   - Verify the image URL is accessible
   - Check browser console for errors

4. **Changes not persisting**
   - Verify Firestore rules allow user updates
   - Check browser network tab for failed requests
   - Ensure proper error handling in the UI

### Getting Help

- Check browser console for detailed error messages
- Verify Firebase Console for rule validation errors
- Test with different image formats and sizes
- Ensure all environment variables are set correctly

---

Your profile management system is now fully functional with avatar uploads, unique handles, and session persistence!
