# ✅ Firestore + Heroku Deployment - Complete Setup

## 🎯 Quick Summary

I've set up your custom auth system to work with **Firestore** (instead of JSON files) and prepared it for **Heroku deployment**.

---

## 📦 What Was Added

### New Files
1. **`server/services/user.service.firestore.js`** - Firestore user database
2. **`server/services/user.service.json.js`** - Original JSON file database (renamed)
3. **`server/services/user.service.js`** - Smart switcher (JSON or Firestore based on env)

### Documentation
1. **`DEPLOY_CUSTOM_AUTH_HEROKU.md`** - Full deployment guide
2. **`DEPLOY_CHECKLIST.md`** - Quick checklist
3. **`FIRESTORE_LOCAL_TESTING.md`** - Test Firestore locally

### Dependencies
- ✅ `firebase-admin` installed (server-side Firestore)

---

## 🚀 How to Deploy (5 Steps)

### Step 1: Get Firebase Service Account (2 min)

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. **Settings** ⚙️ → **Service Accounts**
3. Click **Generate New Private Key**
4. Download the JSON file

### Step 2: Setup Firestore Database (2 min)

1. Firebase Console → **Firestore Database**
2. Click **Create Database** → **Production Mode**
3. Choose a location
4. Go to **Rules** tab, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if false;  // Server only!
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create app (or connect existing)
heroku create your-app-name

# Set environment variables
heroku config:set USE_FIRESTORE=true
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set JWT_SECRET="$(openssl rand -base64 64)"
heroku config:set JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
heroku config:set NODE_ENV=production

# Convert service account to single line (Mac/Linux)
heroku config:set FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccount.json | jq -c)"

# For Windows PowerShell:
# 1. Open serviceAccount.json
# 2. Copy contents to https://www.text-utils.com/json-formatter/
# 3. Click "Minify" to get single line
# 4. Then: heroku config:set FIREBASE_SERVICE_ACCOUNT='paste-here'

# Deploy
git add .
git commit -m "Deploy custom auth with Firestore"
git push heroku main
```

### Step 4: Test It

```bash
# Test registration
curl -X POST https://your-app-name.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"TestUser"}'

# Check Firestore Console - you should see the user!
```

### Step 5: Update Frontend

Update `client/.env`:
```env
REACT_APP_API_URL=https://your-app-name.herokuapp.com
# ... keep your Firebase config for Storage
```

---

## 🧪 Test Locally First (Recommended)

### Option 1: Test with Firestore Locally

1. Download service account JSON from Firebase
2. Save as `server/serviceAccount.json`
3. Update `server/.env`:
```env
USE_FIRESTORE=true
FIREBASE_PROJECT_ID=your-project-id
NODE_ENV=development
JWT_SECRET=local-dev-secret
JWT_REFRESH_SECRET=local-refresh-secret
```
4. Start server:
```bash
cd server
npm start
```
5. Test registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"local@test.com","password":"test123","username":"LocalUser"}'
```
6. Check Firebase Console → Firestore → `users` collection

### Option 2: Test with JSON Files (Original)

Just set in `server/.env`:
```env
USE_FIRESTORE=false
```

Users will be stored in `server/data/users.json` like before.

---

## 📋 Environment Variables

### For Local Development (`server/.env`)
```env
USE_FIRESTORE=true
FIREBASE_PROJECT_ID=your-project-id
NODE_ENV=development
JWT_SECRET=local-secret
JWT_REFRESH_SECRET=local-refresh-secret

# Service account will auto-load from serviceAccount.json file
```

### For Heroku Production
```bash
heroku config:set USE_FIRESTORE=true
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="<strong-64-char-secret>"
heroku config:set JWT_REFRESH_SECRET="<strong-64-char-secret>"
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

---

## 🔐 Security Notes

### ✅ What's Secure
- Passwords hashed with bcrypt
- JWT tokens signed and expire
- Firestore Admin SDK bypasses client rules
- Service account stored as env var (not in code)

### ⚠️ Before Production
1. **Generate strong secrets:**
   ```bash
   openssl rand -base64 64
   ```
2. **Never commit** `serviceAccount.json` to git
3. **Update Firestore rules** as shown above
4. **Enable CORS** for your domain only:
   ```javascript
   // server/index.js
   app.use(cors({
     origin: 'https://your-frontend-domain.com'
   }));
   ```

---

## 🎮 What You Get

### User Flow
1. User signs up → Creates account in Firestore
2. Password hashed with bcrypt
3. JWT tokens generated and returned
4. User data stored in Firestore `users` collection
5. Avatar uploads still use Firebase Storage
6. All game data can use Firestore too!

### Database Structure (Firestore)
```
users (collection)
  └── user_1234567890_abc123 (document)
      ├── uid: "user_1234567890_abc123"
      ├── email: "user@example.com"
      ├── password: "$2a$10$..." (hashed)
      ├── username: "TestUser"
      ├── handle: "testuser"
      ├── avatarUrl: ""
      ├── level: 1
      ├── xp: 0
      ├── strength: 10
      ├── endurance: 10
      ├── agility: 10
      ├── gym: ""
      ├── workoutStreak: 0
      ├── lastWorkout: null
      ├── equipment: {}
      ├── inventory: []
      ├── createdAt: Timestamp
      └── updatedAt: Timestamp
```

---

## 📚 Full Documentation

- **Quick Deploy**: `DEPLOY_CHECKLIST.md`
- **Full Guide**: `DEPLOY_CUSTOM_AUTH_HEROKU.md`
- **Local Testing**: `FIRESTORE_LOCAL_TESTING.md`
- **Auth System**: `AUTHENTICATION_SYSTEM.md`

---

## 🆘 Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
cd server
npm install firebase-admin
```

### "Service account not found"
Make sure either:
- `serviceAccount.json` exists in `server/` folder (local), OR
- `FIREBASE_SERVICE_ACCOUNT` env var is set (Heroku)

### "Permission denied" in Firestore
Check Firestore rules - users collection should block client access (server uses Admin SDK)

### "Application error" on Heroku
```bash
heroku logs --tail
```
Usually missing environment variables.

---

## ✅ Deployment Checklist

Before going live:

- [ ] Firebase service account downloaded
- [ ] Firestore database created
- [ ] Firestore rules updated
- [ ] `firebase-admin` installed
- [ ] Heroku app created
- [ ] All env vars set on Heroku
- [ ] Strong JWT secrets generated
- [ ] Code committed and pushed
- [ ] Deployment successful (`git push heroku main`)
- [ ] Test registration works
- [ ] User appears in Firestore
- [ ] Frontend updated with Heroku URL

---

## 🎉 You're Ready!

Your custom auth system now supports:
- ✅ Firestore database (scalable!)
- ✅ Local JSON files (for quick dev)
- ✅ Switch between them with one env var
- ✅ Heroku deployment ready
- ✅ Production-grade security
- ✅ Firebase Storage for avatars

**Next steps:**
1. Follow `DEPLOY_CHECKLIST.md`
2. Test locally with Firestore
3. Deploy to Heroku
4. Celebrate! 🎊

