# Local Testing with Firestore

Want to test Firestore locally before deploying? Here's how:

## Step 1: Get Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Generate New Private Key → Save as `serviceAccount.json`
4. **DO NOT commit this file to git!**

## Step 2: Update .gitignore

Make sure `server/.gitignore` includes:
```
serviceAccount.json
.env
data/
```

## Step 3: Configure Local Environment

Create/update `server/.env`:

```env
# Use Firestore instead of JSON file
USE_FIRESTORE=true

# JWT Secrets
JWT_SECRET=local-dev-secret-key
JWT_REFRESH_SECRET=local-dev-refresh-key

# Firebase Project ID
FIREBASE_PROJECT_ID=your-project-id

# Service Account - Option 1: File path (EASIER FOR LOCAL)
# Just put the serviceAccount.json in server folder
# The code will auto-detect it

# Service Account - Option 2: JSON string (SAME AS PRODUCTION)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Server
PORT=5000
NODE_ENV=development
```

## Step 4: Update Service to Support File Path

Update `server/services/user.service.firestore.js`:

```javascript
function initFirestore() {
  if (db) return db;

  try {
    if (!admin.apps.length) {
      // Option 1: Use service account from file (local dev)
      if (process.env.NODE_ENV === 'development') {
        const serviceAccountPath = path.join(__dirname, '../serviceAccount.json');
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
          });
          logger.info('Firestore initialized with service account file');
          db = admin.firestore();
          return db;
        }
      }
      
      // Option 2: Use service account from env var (production)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        logger.info('Firestore initialized with env var service account');
      } else {
        // Option 3: Use default credentials (Cloud Functions/GCP)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        logger.info('Firestore initialized with default credentials');
      }
    }
    
    db = admin.firestore();
    return db;
  } catch (error) {
    logger.error('Failed to initialize Firestore', { error: error.message });
    throw error;
  }
}
```

## Step 5: Start Server with Firestore

```bash
cd server
npm start
```

You should see:
```
✅ Firestore initialized with service account file
✅ ForgeArena server running on port 5000
```

## Step 6: Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"TestUser"}'
```

## Step 7: Verify in Firebase Console

1. Go to Firebase Console → Firestore
2. You should see `users` collection
3. Your test user should be there!

---

## Switch Between JSON and Firestore

### Use JSON File (Original)
```env
USE_FIRESTORE=false
```
Users stored in `server/data/users.json`

### Use Firestore
```env
USE_FIRESTORE=true
```
Users stored in Firestore

---

## Troubleshooting

### "Service account not found"
Make sure `serviceAccount.json` is in `server/` folder

### "Permission denied"
1. Check Firestore rules
2. Verify service account has permissions
3. Make sure project ID is correct

### "Module not found: firebase-admin"
```bash
cd server
npm install firebase-admin
```

### Want to see which mode you're in?
Check server startup logs:
```
Using Firestore user service
```
or
```
Using Local JSON user service
```

---

## Best Practice

**Local Development:**
- Use `serviceAccount.json` file
- Set `USE_FIRESTORE=true` or `false` as needed
- Test both modes

**Production (Heroku):**
- Use `FIREBASE_SERVICE_ACCOUNT` env var (JSON string)
- Always set `USE_FIRESTORE=true`
- Never commit service account to git

