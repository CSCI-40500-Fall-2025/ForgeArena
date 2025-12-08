# 🚀 Heroku All-in-One Deployment - Complete Setup

You're deploying both frontend and backend to the same Heroku app!

## ✅ What I've Done

1. ✅ Updated `AuthContext.tsx` - Uses empty string for production API URL
2. ✅ Updated `App.tsx` - Uses relative `/api` path in production
3. ✅ Verified `package.json` - Has `heroku-postbuild` script
4. ✅ Verified `Procfile` - Starts server correctly
5. ✅ Verified `server/index.js` - Serves React build in production

## 📋 Complete Deployment Steps

### Step 1: Create/Update `.env.production` File

Since I can't create it automatically, **manually create** `client/.env.production`:

```env
# Leave API URL empty - uses same domain in production
REACT_APP_API_URL=

# Add your Firebase config (replace with your actual values)
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 2: Commit Your Changes

```bash
git add .
git commit -m "Configure for Heroku all-in-one deployment"
```

### Step 3: Create Heroku App (if not done)

```bash
heroku login
heroku create your-forge-arena-app
```

### Step 4: Set Heroku Environment Variables

```bash
# Essential config
heroku config:set USE_FIRESTORE=false
heroku config:set NODE_ENV=production

# Generate strong JWT secrets (PowerShell)
$bytes = New-Object Byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$secret = [Convert]::ToBase64String($bytes)
heroku config:set JWT_SECRET="$secret"

$bytes2 = New-Object Byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes2)
$refreshSecret = [Convert]::ToBase64String($bytes2)
heroku config:set JWT_REFRESH_SECRET="$refreshSecret"
```

### Step 5: Deploy to Heroku

```bash
# Since you're on feat/custom_auth branch
git push heroku feat/custom_auth:main
```

### Step 6: Watch the Build

```bash
heroku logs --tail
```

You should see:
```
remote: -----> Building on the Heroku-22 stack
remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote: -----> Running heroku-postbuild
remote:        Building React app...
remote: -----> Build succeeded!
remote: -----> Launching...
```

### Step 7: Open Your App

```bash
heroku open
```

---

## 🔐 If Using Firestore (Optional)

If you want to use Firestore instead of JSON files:

```bash
# Set Firestore config
heroku config:set USE_FIRESTORE=true
heroku config:set FIREBASE_PROJECT_ID=your-project-id

# Minify your serviceAccount.json first:
# 1. Open serviceAccount.json
# 2. Go to: https://www.text-utils.com/json-formatter/
# 3. Paste JSON, click "Minify"
# 4. Copy the minified output
# 5. Then set it:
heroku config:set FIREBASE_SERVICE_ACCOUNT='paste-minified-json-here'
```

---

## 📊 What Happens During Deployment

1. **Heroku receives your code**
2. **Detects Node.js app**
3. **Installs root dependencies**
4. **Runs `heroku-postbuild`:**
   - Installs server dependencies
   - Installs client dependencies
   - Builds React app → `client/build/`
5. **Starts server** with `npm start`
6. **Server serves:**
   - API routes at `/api/*`
   - React app for all other routes

---

## ✅ Testing Your Deployment

### Test API Endpoint
```bash
curl https://your-app-name.herokuapp.com/api/user
```

### Test Registration
```bash
curl -X POST https://your-app-name.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","username":"TestUser"}'
```

### Open in Browser
```bash
heroku open
```

You should see the login page. Try signing up!

---

## 🐛 Troubleshooting

### Build Failed - Missing Dependencies
```bash
heroku logs --tail
# Look for npm install errors

# Fix: Make sure package.json is committed
git add package.json server/package.json client/package.json
git commit -m "Add all package.json files"
git push heroku feat/custom_auth:main
```

### Application Error After Deploy
```bash
heroku logs --tail

# Common causes:
# 1. Missing env vars
heroku config

# 2. Build didn't complete
heroku run bash
ls client/build/  # Should show index.html

# 3. Server crash
# Check logs for errors
```

### Still Getting localhost:5000 Error

Make sure:
1. `client/.env.production` has `REACT_APP_API_URL=` (empty)
2. Your changes are committed
3. React app was rebuilt during deployment

Force rebuild:
```bash
heroku repo:purge_cache -a your-app-name
git push heroku feat/custom_auth:main
```

---

## 🎯 Quick Deploy Command Summary

```bash
# 1. Create .env.production file (see above)

# 2. Commit everything
git add .
git commit -m "Configure for Heroku deployment"

# 3. Create Heroku app
heroku create your-app-name

# 4. Set config vars
heroku config:set USE_FIRESTORE=false NODE_ENV=production
heroku config:set JWT_SECRET="your-secret" JWT_REFRESH_SECRET="your-refresh-secret"

# 5. Deploy!
git push heroku feat/custom_auth:main

# 6. Open app
heroku open
```

---

## 📝 Next Steps After Deployment

1. **Test Registration** - Sign up with a new account
2. **Test Login** - Log out and log back in
3. **Check Logs** - `heroku logs --tail` to monitor
4. **Set Custom Domain** (optional) - `heroku domains:add yourdomain.com`
5. **Enable HTTPS** (automatic on Heroku)

---

## 🎉 Success Checklist

- [ ] Code committed with API URL fixes
- [ ] `client/.env.production` created
- [ ] Heroku app created
- [ ] Environment variables set
- [ ] Code pushed to Heroku
- [ ] Build completed successfully
- [ ] App opens in browser
- [ ] Can register new user
- [ ] Can login
- [ ] No console errors

Your custom auth system is now live on Heroku! 🚀

