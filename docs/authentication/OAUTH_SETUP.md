# OAuth Sign-In Setup Guide

This guide explains how to set up Google and GitHub sign-in for ForgeArena.

## Prerequisites

1. Firebase project configured
2. Firebase Authentication enabled
3. Environment variables set (see `firebase.env.example`)

## 1. Google Sign-In Setup

### Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Authentication** → **Sign-in method**
3. Click **Google** → Enable it
4. Add your **Project support email**
5. Click **Save**

### Authorized Domains (Required for Production)

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g., `yourapp.herokuapp.com`)

That's it! Google sign-in should work out of the box.

---

## 2. GitHub Sign-In Setup

### GitHub OAuth App Creation

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: ForgeArena
   - **Homepage URL**: `https://yourapp.herokuapp.com` (or `http://localhost:3000` for dev)
   - **Authorization callback URL**: `https://YOUR_PROJECT_ID.firebaseapp.com/__/auth/handler`
     - Replace `YOUR_PROJECT_ID` with your Firebase project ID
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### Firebase Console Configuration

1. Go to Firebase Console → **Authentication** → **Sign-in method**
2. Click **GitHub** → Enable it
3. Paste the **Client ID** and **Client Secret** from GitHub
4. Copy the **callback URL** shown and verify it matches your GitHub OAuth app
5. Click **Save**

---

## Environment Variables

Ensure these are set in your environment:

### Client (.env in client folder)

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Server (environment or .env)

```env
# Firebase Admin SDK service account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-project-id

# Or for local development, place serviceAccount.json in server/ folder
```

---

## Testing Locally

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm start`
3. Navigate to the login page
4. Click on any OAuth provider button
5. Complete the OAuth flow in the popup
6. You should be logged in and redirected

### Common Issues

1. **Popup blocked**: Allow popups for localhost in your browser
2. **Invalid callback URL**: Verify the callback URL in provider settings matches Firebase
3. **CORS errors**: Ensure `localhost:3000` is in Firebase authorized domains
4. **Token verification fails**: Check that FIREBASE_SERVICE_ACCOUNT is valid JSON

---

## Security Considerations

1. **Never expose** your Firebase service account key in client-side code
2. **Always verify** Firebase ID tokens on the server
3. **Use HTTPS** in production
4. **Rotate secrets** periodically (especially GitHub client secret)

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Client    │────▶│  Firebase Auth  │────▶│   OAuth     │
│ (React App) │     │   (ID Token)    │     │  Provider   │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │ Firebase ID Token                         │
       ▼                                           ▼
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Server    │────▶│ Firebase Admin  │────▶│   Create/   │
│  (Express)  │     │ (Verify Token)  │     │  Find User  │
└─────────────┘     └─────────────────┘     └─────────────┘
       │
       │ JWT Tokens (access + refresh)
       ▼
┌─────────────┐
│   Client    │
│   Storage   │
└─────────────┘
```

The flow:
1. User clicks OAuth button → Firebase Auth popup opens
2. User authenticates with provider (Google/GitHub/Apple)
3. Firebase returns an ID token to the client
4. Client sends ID token to server `/api/auth/oauth`
5. Server verifies token with Firebase Admin SDK
6. Server creates/finds user in database
7. Server returns JWT tokens for session management
8. Client stores tokens and uses for authenticated requests

