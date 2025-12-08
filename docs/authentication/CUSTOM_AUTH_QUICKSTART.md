# Custom Authentication System - Quick Start Guide

This project now uses a **custom JWT-based authentication system** instead of Firebase Auth. Firebase is still used for Storage (avatars) and optionally for Firestore.

## Quick Setup

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
PORT=5000
NODE_ENV=development

# Firebase (for Storage only)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# ... other Firebase config
```

**Frontend (`client/.env`):**
```env
REACT_APP_API_URL=http://localhost:5000

# Firebase (for Storage only)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# ... other Firebase config
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Authentication Features

### What Changed
- **Custom JWT Authentication**: No more Firebase Auth SDK
- **Local User Database**: Users stored in `server/data/users.json`
- **Password Hashing**: Secure bcrypt hashing
- **Token-based Auth**: Access tokens (1h) + Refresh tokens (7d)
- **Protected API Routes**: JWT middleware on backend
- **Auto Token Refresh**: Frontend automatically refreshes expired tokens
- **Firebase Storage**: Still used for avatar uploads
- **Firestore**: Still available for game data

### Authentication Endpoints

```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login existing user
POST /api/auth/refresh    - Refresh access token
POST /api/auth/logout     - Logout (clear tokens)

GET  /api/user/profile    - Get current user (protected)
PUT  /api/user/profile    - Update profile (protected)
PUT  /api/user/handle     - Update handle (protected)
```

## 🧪 Testing the System

### 1. Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"TestUser"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Access Protected Route
```bash
curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

### New Backend Files
```
server/
├── config/
│   └── auth.config.js          # Auth configuration
├── middleware/
│   └── auth.middleware.js      # JWT verification
├── routes/
│   ├── auth.routes.js          # Auth endpoints
│   └── user.routes.js          # User profile endpoints
├── services/
│   └── user.service.js         # User CRUD operations
├── utils/
│   └── auth.utils.js           # Auth utilities (JWT, bcrypt)
└── data/
    └── users.json              # User database (auto-created)
```

### Modified Frontend Files
```
client/src/
├── contexts/
│   └── AuthContext.tsx         # Custom auth context
├── utils/
│   └── api.ts                  # API utilities with auth
└── firebaseConfig.ts           # Firebase (Storage only, no Auth)
```

## Security Features

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Secure token generation with expiration
3. **Token Refresh**: Automatic refresh on expiration
4. **Protected Routes**: Middleware verification on backend
5. **Input Validation**: Email, password, username validation
6. **Handle Uniqueness**: Auto-generated unique handles

## Development

### Adding Protected Routes

**Backend:**
```javascript
const { authenticateToken } = require('./middleware/auth.middleware');

app.get('/api/protected-route', authenticateToken, (req, res) => {
  // req.user contains authenticated user data
  res.json({ user: req.user });
});
```

**Frontend:**
```typescript
import api from './utils/api';

// Automatically includes auth token
const data = await api.get('/api/protected-route');
```

### User Data Structure

```typescript
{
  uid: string,           // Unique user ID
  email: string,         // Email address
  username: string,      // Display username
  handle: string,        // Unique @handle
  avatarUrl: string,     // Firebase Storage URL
  level: number,         // Game level
  xp: number,           // Experience points
  strength: number,      // Game stats
  endurance: number,
  agility: number,
  gym: string,          // Current gym
  workoutStreak: number,
  lastWorkout: string,
  equipment: object,     // Equipped items
  inventory: array,      // Item IDs
  createdAt: string,     // ISO timestamp
  updatedAt: string      // ISO timestamp
}
```

## 📝 Migration Notes

If you have existing Firebase Auth users:
1. Users will need to re-register with the new system
2. Old Firebase Auth data won't be migrated automatically
3. Firebase Storage and Firestore still work normally
4. Consider implementing a migration script if needed

## Troubleshooting

### "Users database not found"
- The `server/data/users.json` file is auto-created on first run
- Make sure the server has write permissions

### "Invalid token"
- Check that JWT_SECRET is set in backend `.env`
- Clear localStorage in browser and login again
- Check token hasn't expired (access tokens expire in 1 hour)

### "Firebase storage error"
- Ensure Firebase config is set in both backend and frontend `.env`
- Check Firebase Storage rules allow authenticated writes
- Verify Storage bucket URL is correct

## Additional Documentation

- Full documentation: `AUTHENTICATION_SYSTEM.md`
- Original Firebase setup: `FIREBASE_SETUP_GUIDE.md`
- Deployment guide: `DEPLOYMENT_SETUP.md`

## Ready to Play!

Once both servers are running:
1. Open http://localhost:3000
2. Click "Sign Up" to create an account
3. Enter email, password, and username
4. Start your fitness journey! 💪

---

**Note**: Remember to change the JWT secrets before deploying to production!

