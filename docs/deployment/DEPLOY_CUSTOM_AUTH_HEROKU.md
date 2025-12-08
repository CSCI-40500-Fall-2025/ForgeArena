# Deploy Custom Auth System to Firestore + Heroku

This guide walks you through deploying your custom authentication system using Firestore for the database and Heroku for hosting.

## Part 1: Setup Firestore for User Database

### Step 1: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the **gear icon** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (keep it secure!)

### Step 2: Configure Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Production mode** or **Test mode** (test for now)
4. Select a location close to your users

### Step 3: Update Firestore Rules

Go to **Firestore Database** → **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only server can write via Admin SDK
    match /users/{userId} {
      // Only server with Admin SDK can read/write
      allow read, write: if false;
    }
    
    // Other collections (game data, etc.)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Important**: Users collection is server-only. The server uses Admin SDK to bypass these rules.

### Step 4: Local Environment Setup

Create `server/.env`:

```env
# Use Firestore for user database
USE_FIRESTORE=true

# JWT Secrets (generate strong ones!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id

# Firebase Service Account (paste the entire JSON file content as one line)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}

# Server Config
PORT=5000
NODE_ENV=development
```

**Tip**: To convert service account JSON to single line:
```bash
# On Mac/Linux:
cat serviceAccount.json | jq -c

# On Windows PowerShell:
Get-Content serviceAccount.json | ConvertFrom-Json | ConvertTo-Json -Compress
```

Or use this online tool: https://www.text-utils.com/json-formatter/

---

## Part 2: Deploy to Heroku

### Step 1: Install Heroku CLI

```bash
# Mac
brew tap heroku/brew && brew install heroku

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Verify installation
heroku --version
```

### Step 2: Login to Heroku

```bash
heroku login
```

### Step 3: Create Heroku App

```bash
# Create new app (or use existing)
heroku create your-app-name

# Or if you already have an app
heroku git:remote -a your-existing-app-name
```

### Step 4: Set Heroku Environment Variables

```bash
# Essential - Use Firestore
heroku config:set USE_FIRESTORE=true

# JWT Secrets (CHANGE THESE!)
heroku config:set JWT_SECRET="$(openssl rand -base64 64)"
heroku config:set JWT_REFRESH_SECRET="$(openssl rand -base64 64)"

# Firebase Config
heroku config:set FIREBASE_PROJECT_ID=your-project-id

# Firebase Service Account (paste entire JSON as string)
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"..."}'

# Node environment
heroku config:set NODE_ENV=production
```

**For Windows PowerShell** (generate secrets):
```powershell
# Generate random secret
$bytes = New-Object Byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

### Step 5: Update package.json for Heroku

Make sure `server/package.json` has the start script:

```json
{
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Step 6: Update Procfile

Create/update `Procfile` in the root:

```
web: cd server && npm install && node index.js
```

### Step 7: Build Frontend for Production

```bash
cd client
npm run build
```

The build folder should be served by your Express server (already configured in `server/index.js`).

### Step 8: Deploy to Heroku

```bash
# Add and commit all changes
git add .
git commit -m "Add custom auth with Firestore support"

# Push to Heroku
git push heroku main
# or if you're on master branch:
git push heroku master

# Check logs
heroku logs --tail
```

### Step 9: Update Frontend Environment

Update your client `.env` (or Vercel/hosting platform):

```env
REACT_APP_API_URL=https://your-app-name.herokuapp.com

# Firebase Config (same as before)
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

---

## Part 3: Testing Your Deployment

### Test Backend API

```bash
# Test registration
curl -X POST https://your-app-name.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"TestUser"}'

# Test login
curl -X POST https://your-app-name.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Verify in Firestore

1. Go to Firebase Console → Firestore Database
2. You should see a `users` collection
3. Your test user should be there with hashed password

---

## Part 4: Deploy Frontend

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from client folder
cd client
vercel

# Follow prompts, set environment variables
```

### Option B: Serve from Heroku

The server already serves the React build folder in production mode. Just make sure you run:

```bash
cd client
npm run build
git add client/build
git commit -m "Add production build"
git push heroku main
```

Then access your app at: `https://your-app-name.herokuapp.com`

---

## Troubleshooting

### "Cannot find module 'firebase-admin'"

```bash
cd server
npm install firebase-admin
git add package.json package-lock.json
git commit -m "Add firebase-admin"
git push heroku main
```

### "Invalid service account"

Make sure `FIREBASE_SERVICE_ACCOUNT` is set correctly:
```bash
# Check if it's set
heroku config:get FIREBASE_SERVICE_ACCOUNT

# Should show the JSON content
```

### "Firestore permission denied"

The server uses Admin SDK which bypasses Firestore rules. If you get this error:
1. Check service account is valid
2. Make sure `FIREBASE_PROJECT_ID` matches your project
3. Verify service account has "Editor" or "Owner" role in Firebase

### "Application error" on Heroku

```bash
# Check logs
heroku logs --tail

# Common issues:
# 1. Missing environment variables
# 2. Build failed - check package.json
# 3. Port binding - app should use process.env.PORT
```

---

## Security Checklist for Production

- [ ] Strong JWT secrets generated (64+ characters)
- [ ] `USE_FIRESTORE=true` set
- [ ] Service account JSON stored securely (as env var, not in code)
- [ ] Firestore rules updated to deny client access to users collection
- [ ] HTTPS enabled (Heroku does this automatically)
- [ ] CORS configured for your frontend domain only
- [ ] Rate limiting enabled (recommended)
- [ ] Environment variables set in Heroku
- [ ] No sensitive data in git repository

---

## Environment Variables Summary

### Server (Heroku)
```
USE_FIRESTORE=true
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_SERVICE_ACCOUNT=<service-account-json>
NODE_ENV=production
```

### Client (Vercel/Hosting)
```
REACT_APP_API_URL=https://your-app.herokuapp.com
REACT_APP_FIREBASE_API_KEY=<your-key>
REACT_APP_FIREBASE_PROJECT_ID=<your-project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<your-bucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
REACT_APP_FIREBASE_APP_ID=<your-app-id>
```

---

## Quick Deploy Commands

```bash
# 1. Commit changes
git add .
git commit -m "Setup Firestore and custom auth"

# 2. Set Heroku env vars (see Step 4 above)

# 3. Deploy
git push heroku main

# 4. Check it works
heroku open
heroku logs --tail
```

---

## Next Steps

Once deployed:
1. Test user registration/login
2. Verify users appear in Firestore
3. Test avatar uploads (should still work with Firebase Storage)
4. Monitor Heroku logs for errors
5. Set up monitoring (Heroku metrics, Sentry, etc.)

**🎉 You're now running a production-ready custom auth system with Firestore!**

