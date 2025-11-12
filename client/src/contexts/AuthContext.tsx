import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db, storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Types
interface AuthUser extends User {
  displayName: string | null;
}

interface UserProfile {
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
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateHandle: (newHandle: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  checkHandleAvailability: (handle: string) => Promise<boolean>;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if handle is available
  const checkHandleAvailability = useCallback(async (handle: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'users'), where('handle', '==', handle));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking handle availability:', error);
      return false;
    }
  }, []);

  // Create user profile in Firestore
  const createUserProfile = useCallback(async (user: AuthUser, username: string) => {
    const userDoc = doc(db, 'users', user.uid);
    
    // Generate a unique handle based on username
    let handle = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    let handleCounter = 0;
    let originalHandle = handle;
    
    // Ensure handle is unique
    while (!(await checkHandleAvailability(handle))) {
      handleCounter++;
      handle = `${originalHandle}${handleCounter}`;
    }
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      username,
      handle,
      avatarUrl: '',
      level: 1,
      xp: 0,
      strength: 10,
      endurance: 10,
      agility: 10,
      gym: '',
      workoutStreak: 0,
      lastWorkout: null,
      equipment: {},
      inventory: [],
      createdAt: new Date().toISOString()
    };
    
    await setDoc(userDoc, userProfile);
    return userProfile;
  }, [checkHandleAvailability]);

  // Get user profile from Firestore
  const getUserProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = doc(db, 'users', uid);
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Sign up function
  const signup = async (email: string, password: string, username: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, { displayName: username });
      
      // Create user profile in Firestore
      const profile = await createUserProfile(user as AuthUser, username);
      setUserProfile(profile);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to log in');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Failed to log out');
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    
    try {
      const userDoc = doc(db, 'users', currentUser.uid);
      const updatedProfile = { ...userProfile, ...updates };
      
      await setDoc(userDoc, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user as AuthUser);
        
        // Fetch user profile from Firestore
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          // If no profile exists, create one (for existing users)
          const newProfile = await createUserProfile(user as AuthUser, user.displayName || 'User');
          setUserProfile(newProfile);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [createUserProfile, getUserProfile]);

  // Update user handle
  const updateHandle = async (newHandle: string) => {
    if (!currentUser || !userProfile) {
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
      const userDoc = doc(db, 'users', currentUser.uid);
      await setDoc(userDoc, { handle: newHandle }, { merge: true });
      
      const updatedProfile = { ...userProfile, handle: newHandle };
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating handle:', error);
      throw new Error('Failed to update handle');
    }
  };

  // Upload avatar to Firebase Storage
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
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
    logout,
    updateUserProfile,
    updateHandle,
    uploadAvatar,
    checkHandleAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};