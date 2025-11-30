# Custom Authentication System

This project uses a custom JWT-based authentication system instead of Firebase Auth. However, Firebase is still used for:
- **Firebase Storage**: For avatar uploads
- **Firestore**: For database (if needed)

## Architecture Overview

### Backend Authentication
- **JWT Tokens**: Access tokens (1 hour) and refresh tokens (7 days)
- **Password Hashing**: Using bcryptjs with salt rounds
- **User Database**: Local JSON file (`server/data/users.json`)

### Authentication Flow

1. **Registration** (`POST /api/auth/register`)
   - Validates email, username, and password
   - Hashes password with bcrypt
   - Generates unique handle
   - Returns access token and refresh token

2. **Login** (`POST /api/auth/login`)
   - Verifies email and password
   - Returns access token and refresh token

3. **Token Refresh** (`POST /api/auth/refresh`)
   - Uses refresh token to get new access token

4. **Protected Routes**
   - Use `authenticateToken` middleware
   - Requires `Authorization: Bearer <token>` header

### Frontend Authentication
- **AuthContext**: Manages auth state and tokens
- **Token Storage**: localStorage for both tokens
- **Auto-refresh**: Automatically refreshes expired tokens
- **API Utilities**: `utils/api.ts` for authenticated requests

## API Endpoints

### Public Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/user/handle/:handle/availability
```

### Protected Endpoints (Require Authentication)
```
GET  /api/user/profile
PUT  /api/user/profile
PUT  /api/user/handle
POST /api/workout
... (all game-related endpoints)
```

## Environment Variables

### Backend
```
JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
```

### Frontend
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## Security Considerations

1. **Password Requirements**: Minimum 6 characters (configurable)
2. **Token Expiration**: Access tokens expire in 1 hour
3. **Secure Storage**: Passwords hashed with bcrypt (10 rounds)
4. **CORS**: Configured for cross-origin requests
5. **Validation**: Input validation on both frontend and backend

## Firebase Storage Integration

Avatar uploads still use Firebase Storage:
- Images compressed on client before upload
- Stored in `avatars/` folder with UID prefix
- Old avatars automatically deleted on new upload
- URLs stored in user profile

## Migration from Firebase Auth

The custom auth system maintains compatibility:
- User profiles have same structure
- Avatar uploads still use Firebase Storage
- Firestore can still be used for game data
- Only authentication is custom (no Firebase Auth SDK)

## Usage Example

### Frontend
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { login, signup, logout, currentUser } = useAuth();
  
  // Register new user
  await signup(email, password, username);
  
  // Login
  await login(email, password);
  
  // Access current user
  console.log(currentUser);
  
  // Logout
  await logout();
}
```

### Making Authenticated API Calls
```typescript
import api from './utils/api';

// GET request
const data = await api.get('/api/user/profile');

// POST request
const result = await api.post('/api/workout', { exercise: 'pushups', reps: 50 });
```

## Files Created/Modified

### Backend Files Created
- `server/config/auth.config.js` - Auth configuration
- `server/utils/auth.utils.js` - Auth utility functions
- `server/services/user.service.js` - User service (CRUD operations)
- `server/middleware/auth.middleware.js` - JWT verification middleware
- `server/routes/auth.routes.js` - Authentication endpoints
- `server/routes/user.routes.js` - User profile endpoints

### Frontend Files Modified
- `client/src/contexts/AuthContext.tsx` - Custom auth context
- `client/src/firebaseConfig.ts` - Removed Auth, kept Storage
- `client/src/utils/api.ts` - API utility for authenticated requests

### Frontend Files Removed
- Firebase Auth imports removed (only Auth, not Storage/Firestore)

