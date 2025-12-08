# Quick Deploy Checklist - Custom Auth to Heroku + Firestore

## ☑️ Pre-Deployment Checklist

### 1. Get Firebase Service Account (5 minutes)
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Project Settings → Service Accounts
- [ ] Generate New Private Key → Download JSON
- [ ] Keep this file secure!

### 2. Setup Firestore (2 minutes)
- [ ] Firebase Console → Firestore Database
- [ ] Create Database (Production mode)
- [ ] Update Rules (see below)

### 3. Install Dependencies (1 minute)
```bash
cd server
npm install firebase-admin
```

---

## 🚀 Deployment Steps

### Step 1: Configure Firestore Rules

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if false;  // Server-only via Admin SDK
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 2: Setup Heroku

```bash
# Install Heroku CLI (if needed)
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app (or use existing)
heroku create your-app-name
# OR
heroku git:remote -a your-existing-app
```

### Step 3: Set Environment Variables on Heroku

**Method 1: Using Heroku CLI**

```bash
# Essential
heroku config:set USE_FIRESTORE=true
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set NODE_ENV=production

# JWT Secrets (generate strong ones!)
heroku config:set JWT_SECRET="your-super-long-secret-key-here-64-chars-plus"
heroku config:set JWT_REFRESH_SECRET="your-super-long-refresh-key-here-64-chars-plus"

# Service Account (paste entire JSON as one line)
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'
```

**Method 2: Using Heroku Dashboard**

1. Go to https://dashboard.heroku.com/apps/your-app-name/settings
2. Click "Reveal Config Vars"
3. Add each variable:
   - `USE_FIRESTORE` = `true`
   - `FIREBASE_PROJECT_ID` = `your-project-id`
   - `JWT_SECRET` = (generate with tool below)
   - `JWT_REFRESH_SECRET` = (generate with tool below)
   - `FIREBASE_SERVICE_ACCOUNT` = (paste entire JSON)
   - `NODE_ENV` = `production`

**Generate Strong Secrets:**
```bash
# Mac/Linux
openssl rand -base64 64

# Windows PowerShell
$bytes = New-Object Byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes); [Convert]::ToBase64String($bytes)

# Or use: https://generate-secret.vercel.app/64
```

**Convert Service Account JSON to Single Line:**
```bash
# Mac/Linux
cat serviceAccount.json | jq -c

# Or manually: Copy JSON → Paste in online JSON formatter → Copy minified
# https://www.text-utils.com/json-formatter/
```

### Step 4: Update Server Configuration

Make sure `server/package.json` has:

```json
{
  "engines": {
    "node": "18.x"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

### Step 5: Build Frontend

```bash
cd client
npm run build
```

### Step 6: Deploy to Heroku

```bash
# Commit everything
git add .
git commit -m "Deploy custom auth with Firestore"

# Push to Heroku
git push heroku main
# (or 'master' if that's your branch)

# Monitor deployment
heroku logs --tail
```

### Step 7: Test Deployment

```bash
# Test registration
curl -X POST https://your-app-name.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","username":"TestUser"}'

# Should return user data and tokens
```

### Step 8: Verify in Firebase

1. Go to Firebase Console → Firestore
2. Check `users` collection
3. You should see your test user with hashed password

---

## 🎯 Frontend Deployment

### Option A: Serve from Heroku (All-in-One)

Already configured! Just access:
```
https://your-app-name.herokuapp.com
```

### Option B: Separate Frontend (Vercel/Netlify)

Update `client/.env`:
```env
REACT_APP_API_URL=https://your-app-name.herokuapp.com

# Your existing Firebase config for Storage
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Then deploy to Vercel:
```bash
cd client
npm i -g vercel
vercel
```

---

## ⚠️ Troubleshooting

### Issue: "Cannot find module 'firebase-admin'"
**Fix:**
```bash
cd server
npm install firebase-admin
git add package.json package-lock.json
git commit -m "Add firebase-admin"
git push heroku main
```

### Issue: "Application Error"
**Check:**
```bash
heroku logs --tail
```

Common causes:
- Missing environment variable
- Service account JSON not set correctly
- Build failed

### Issue: Users not appearing in Firestore
**Check:**
1. `USE_FIRESTORE=true` is set
2. `FIREBASE_SERVICE_ACCOUNT` is valid JSON
3. `FIREBASE_PROJECT_ID` matches your project
4. Service account has permissions

### Issue: CORS errors from frontend
**Fix:** Update `server/index.js`:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

---

## 🔐 Security Verification

After deployment, verify:

- [ ] JWT secrets are long and random (not defaults!)
- [ ] `USE_FIRESTORE=true` is set
- [ ] Service account is stored as env var (not in code)
- [ ] Firestore rules block client access to users collection
- [ ] HTTPS is enabled (automatic on Heroku)
- [ ] CORS configured for your domain only
- [ ] No `.env` files committed to git

---

## 📊 What You Should See

### In Firestore Console:
```
users (collection)
  └── user_1234567890_abc123 (document)
      ├── uid: "user_1234567890_abc123"
      ├── email: "test@example.com"
      ├── password: "$2a$10$..." (hashed)
      ├── username: "TestUser"
      ├── handle: "testuser"
      ├── level: 1
      ├── xp: 0
      └── ... other fields
```

### In Heroku Logs:
```
2024-01-15T10:30:00.000000+00:00 app[web.1]: Firestore initialized successfully
2024-01-15T10:30:01.000000+00:00 app[web.1]: ✅ ForgeArena server running on port 5000
```

---

## 🎉 Success!

Your app is now live with:
- ✅ Custom JWT authentication
- ✅ Firestore user database
- ✅ Secure password hashing
- ✅ Firebase Storage for avatars
- ✅ Production-ready hosting on Heroku

**Access your app at:**
```
https://your-app-name.herokuapp.com
```

**Test it:**
1. Sign up with new account
2. Check Firestore for user data
3. Try logging out and back in
4. Upload an avatar (Firebase Storage)

---

## 📝 Quick Reference

### View Heroku Config
```bash
heroku config
```

### Update a Config Var
```bash
heroku config:set VAR_NAME=value
```

### Restart Heroku App
```bash
heroku restart
```

### View Live Logs
```bash
heroku logs --tail
```

### Open App in Browser
```bash
heroku open
```

### Run Command on Heroku
```bash
heroku run bash
```

---

## 🆘 Need Help?

1. **Check deployment guide**: `DEPLOY_CUSTOM_AUTH_HEROKU.md`
2. **Check logs**: `heroku logs --tail`
3. **Verify env vars**: `heroku config`
4. **Test locally first** with `USE_FIRESTORE=true`
5. **Check Firebase console** for users collection

Common gotchas:
- Service account JSON must be single line
- JWT secrets must be set
- `USE_FIRESTORE` must be `true` (string)
- Firebase project ID must match

