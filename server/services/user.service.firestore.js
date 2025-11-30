const admin = require('firebase-admin');
const authUtils = require('../utils/auth.utils');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Initialize Firestore Admin SDK
 */
function initFirestore() {
  if (db) return db;

  try {
    // Check if already initialized
    if (!admin.apps.length) {
      // Option 1: Use service account from file (local development)
      if (process.env.NODE_ENV === 'development') {
        const serviceAccountPath = path.join(__dirname, '../serviceAccount.json');
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = require(serviceAccountPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
          });
          logger.info('Firestore initialized with service account file');
          db = admin.firestore();
          return db;
        }
      }
      
      // Option 2: Use service account from env var (production/Heroku)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
        logger.info('Firestore initialized with environment variable service account');
      } else {
        // Option 3: Use default credentials (Google Cloud)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        logger.info('Firestore initialized with default credentials');
      }
    }
    
    db = admin.firestore();
    logger.info('Firestore connection established');
    return db;
  } catch (error) {
    logger.error('Failed to initialize Firestore', { error: error.message });
    throw error;
  }
}

/**
 * Get users collection reference
 */
function getUsersCollection() {
  const firestore = initFirestore();
  return firestore.collection('users');
}

/**
 * Find user by email
 */
async function findUserByEmail(email) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('Error finding user by email', { error: error.message, email });
    throw error;
  }
}

/**
 * Find user by uid
 */
async function findUserByUid(uid) {
  try {
    const usersRef = getUsersCollection();
    const doc = await usersRef.doc(uid).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('Error finding user by uid', { error: error.message, uid });
    throw error;
  }
}

/**
 * Find user by handle
 */
async function findUserByHandle(handle) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .where('handle', '==', handle.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('Error finding user by handle', { error: error.message, handle });
    throw error;
  }
}

/**
 * Check if handle is available
 */
async function isHandleAvailable(handle) {
  const user = await findUserByHandle(handle);
  return user === null;
}

/**
 * Create a new user
 */
async function createUser(userData) {
  try {
    // Check if email already exists
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    // Generate unique handle
    const handle = await authUtils.generateUniqueHandle(userData.username, isHandleAvailable);
    
    // Generate uid
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create user object
    const newUser = {
      uid,
      email: userData.email.toLowerCase(),
      password: await authUtils.hashPassword(userData.password),
      username: userData.username,
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Save to Firestore
    const usersRef = getUsersCollection();
    await usersRef.doc(uid).set(newUser);
    
    logger.info('User created successfully in Firestore', {
      uid: newUser.uid,
      email: newUser.email,
      username: newUser.username,
      handle: newUser.handle,
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return {
      ...userWithoutPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating user', { error: error.message });
    throw error;
  }
}

/**
 * Update user profile
 */
async function updateUser(uid, updates) {
  try {
    const usersRef = getUsersCollection();
    const userDoc = usersRef.doc(uid);
    
    // Check if user exists
    const doc = await userDoc.get();
    if (!doc.exists) {
      throw new Error('User not found');
    }
    
    // Don't allow updating sensitive fields
    const allowedFields = [
      'username', 'handle', 'avatarUrl', 'level', 'xp',
      'strength', 'endurance', 'agility', 'gym',
      'workoutStreak', 'lastWorkout', 'equipment', 'inventory'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    // Add updated timestamp
    filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    // Update user
    await userDoc.update(filteredUpdates);
    
    logger.info('User updated successfully', { uid, updates: Object.keys(filteredUpdates) });
    
    // Get updated user
    const updatedDoc = await userDoc.get();
    const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return {
      ...userWithoutPassword,
      createdAt: updatedUser.createdAt?.toDate?.()?.toISOString() || updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt?.toDate?.()?.toISOString() || updatedUser.updatedAt,
    };
  } catch (error) {
    logger.error('Error updating user', { error: error.message, uid });
    throw error;
  }
}

/**
 * Verify user credentials
 */
async function verifyCredentials(email, password) {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const isValid = await authUtils.comparePassword(password, user.password);
    
    if (!isValid) {
      throw new Error('Invalid email or password');
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      createdAt: user.createdAt?.toDate?.()?.toISOString() || user.createdAt,
      updatedAt: user.updatedAt?.toDate?.()?.toISOString() || user.updatedAt,
    };
  } catch (error) {
    logger.error('Error verifying credentials', { error: error.message });
    throw error;
  }
}

/**
 * Initialize (no-op for Firestore, but kept for compatibility)
 */
async function initUsersDb() {
  initFirestore();
  logger.info('Firestore user service initialized');
}

module.exports = {
  initUsersDb,
  findUserByEmail,
  findUserByUid,
  findUserByHandle,
  isHandleAvailable,
  createUser,
  updateUser,
  verifyCredentials,
};

