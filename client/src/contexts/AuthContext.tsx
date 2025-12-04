import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  signInWithGoogle, 
  signInWithGithub, 
  signOutFirebase 
} from '../firebaseConfig';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '' // Use same domain in production (Heroku)
    : 'http://localhost:5000'); // Use local in development

// Types
export type OAuthProvider = 'google' | 'github';

interface AuthUser {
  uid: string;
  email: string;
  username: string;
  handle: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  agility: number;
  gym: string;
  workoutStreak: number;
  lastWorkout: string | null;
  equipment: Record<string, any>;
  inventory: any[];
  createdAt: string;
  // Club fields
  clubId?: string;
  clubRole?: 'founder' | 'officer' | 'member';
  weeklyXP?: number;
  // Party fields
  partyId?: string;
  partyRole?: 'owner' | 'member';
  // OAuth fields
  authProvider?: 'email' | 'google' | 'github' | 'apple';
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: AuthUser | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<void>;
  updateHandle: (newHandle: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  checkHandleAvailability: (handle: string) => Promise<boolean>;
  getAccessToken: () => string | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get access token
  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]);

  // Save tokens to localStorage
  const saveTokens = useCallback((access: string, refresh: string) => {
    setAccessToken(access);
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }, []);

  // Clear tokens from localStorage
  const clearTokens = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      return false;
    }
  }, [clearTokens]);

  // Fetch user profile with authentication
  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const user = await response.json();
      setCurrentUser(user);
      setUserProfile(user);
      
      return user;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);

        try {
          // Try to fetch user profile with stored token
          await fetchUserProfile(storedAccessToken);
        } catch (error) {
          // If failed, try to refresh token
          const refreshed = await refreshAccessToken();
          
          if (refreshed) {
            const newToken = localStorage.getItem('accessToken');
            if (newToken) {
              try {
                await fetchUserProfile(newToken);
              } catch (err) {
                clearTokens();
              }
            }
          } else {
            clearTokens();
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [fetchUserProfile, refreshAccessToken, clearTokens]);

  // Check if handle is available
  const checkHandleAvailability = useCallback(async (handle: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/user/handle/${handle}/availability`);
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking handle availability:', error);
      return false;
    }
  }, []);

  // Sign up function
  const signup = async (email: string, password: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      const data = await response.json();
      
      // Save tokens
      saveTokens(data.accessToken, data.refreshToken);
      
      // Set user
      setCurrentUser(data.user);
      setUserProfile(data.user);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log in');
      }

      const data = await response.json();
      
      // Save tokens
      saveTokens(data.accessToken, data.refreshToken);
      
      // Set user
      setCurrentUser(data.user);
      setUserProfile(data.user);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to log in');
    }
  };

  // OAuth Login function
  const loginWithOAuth = async (provider: OAuthProvider) => {
    try {
      // Select the right OAuth provider
      let oauthResult;
      switch (provider) {
        case 'google':
          oauthResult = await signInWithGoogle();
          break;
        case 'github':
          oauthResult = await signInWithGithub();
          break;
        default:
          throw new Error('Invalid OAuth provider');
      }

      // Get Firebase ID token
      const idToken = await oauthResult.user.getIdToken();
      
      // Send token to backend for verification and user creation/login
      const response = await fetch(`${API_URL}/api/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          provider,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Sign out from Firebase if backend fails
        await signOutFirebase();
        throw new Error(error.error || 'OAuth authentication failed');
      }

      const data = await response.json();
      
      // Save tokens
      saveTokens(data.accessToken, data.refreshToken);
      
      // Set user
      setCurrentUser(data.user);
      setUserProfile(data.user);
      
    } catch (error: any) {
      console.error('OAuth login error:', error);
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email. Try signing in with a different method.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked by browser. Please allow pop-ups and try again.');
      }
      throw new Error(error.message || 'OAuth authentication failed');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint (optional, as JWT is stateless)
      if (accessToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
      
      // Sign out from Firebase (for OAuth users)
      try {
        await signOutFirebase();
      } catch (e) {
        // Ignore Firebase sign out errors
      }
      
      // Clear tokens and user state
      clearTokens();
      setCurrentUser(null);
      setUserProfile(null);
      
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      clearTokens();
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<AuthUser>) => {
    if (!currentUser || !accessToken) return;
    
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      const updatedUser = data.user;
      
      setCurrentUser(updatedUser);
      setUserProfile(updatedUser);
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  };

  // Update user handle
  const updateHandle = async (newHandle: string) => {
    if (!currentUser || !accessToken) {
      throw new Error('No user logged in');
    }

    // Validate handle format
    if (!/^[a-z0-9]{3,20}$/.test(newHandle)) {
      throw new Error('Handle must be 3-20 characters, letters and numbers only');
    }

    // Check if handle is available
    if (!(await checkHandleAvailability(newHandle))) {
      throw new Error('Handle is already taken');
    }

    try {
      const response = await fetch(`${API_URL}/api/user/handle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ handle: newHandle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update handle');
      }

      const data = await response.json();
      const updatedUser = data.user;
      
      setCurrentUser(updatedUser);
      setUserProfile(updatedUser);
      
    } catch (error: any) {
      console.error('Error updating handle:', error);
      throw new Error(error.message || 'Failed to update handle');
    }
  };

  // Upload avatar to Firebase Storage
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!currentUser || !accessToken) {
      throw new Error('No user logged in');
    }

    try {
      // Import Firebase Storage functions dynamically
      const { ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');
      const { storage } = await import('../firebaseConfig');

      // Create storage reference
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatars/${currentUser.uid}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Delete old avatar if exists
      if (userProfile?.avatarUrl) {
        try {
          const oldAvatarRef = ref(storage, userProfile.avatarUrl);
          await deleteObject(oldAvatarRef);
        } catch (error) {
          console.log('Old avatar not found or already deleted');
        }
      }

      // Upload new avatar
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile with new avatar URL
      await updateUserProfile({ avatarUrl: downloadURL });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw new Error('Failed to upload avatar');
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithOAuth,
    logout,
    updateUserProfile,
    updateHandle,
    uploadAvatar,
    checkHandleAvailability,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
