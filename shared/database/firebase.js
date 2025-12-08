// Firebase integration - Server-side Firestore operations
// This file is used by the API routes for Firestore data access
// Note: Client-side Firebase is handled in client/src/firebaseClient.ts

// For server-side usage, we use firebase-admin
// This module can be imported in API routes that need direct Firestore access

/**
 * Server-side Firebase operations
 * Most operations are now handled by the service layer:
 * - server/services/user.service.firestore.js
 * - server/services/quest.service.js
 * - server/services/achievement.service.js
 * - server/services/duel.service.js
 * - server/services/activity.service.js
 * - server/services/leaderboard.service.js
 * - server/services/raid.service.js
 * - server/services/club.service.js
 * - server/services/party.service.js
 */

let adminDb = null;

/**
 * Get Firestore Admin instance (for server-side use)
 */
const getFirestoreAdmin = () => {
  if (adminDb) return adminDb;
  
  try {
    const admin = require('firebase-admin');
    
    if (admin.apps.length) {
      adminDb = admin.firestore();
      return adminDb;
    }
  } catch (error) {
    console.error('Firebase Admin not available:', error.message);
  }
  
  return null;
};

/**
 * Get user data from Firestore
 * @deprecated Use userService.findUserByUid instead
 */
const getUser = async (userId) => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  return { id: userDoc.id, ...userDoc.data() };
};

/**
 * Update user data in Firestore
 * @deprecated Use userService.updateUser instead
 */
const updateUser = async (userId, updates) => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const admin = require('firebase-admin');
  
  await db.collection('users').doc(userId).update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return getUser(userId);
};

/**
 * Get raid boss data
 * @deprecated Use raidService instead
 */
const getRaidBoss = async () => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const raidDoc = await db.collection('raidBosses').doc('current').get();
  
  if (!raidDoc.exists) {
    // Return default boss
    return {
      name: 'Iron Golem',
      description: 'A hulking construct of twisted metal. Defeat it with your workouts!',
      totalHP: 10000,
      currentHP: 10000,
      participants: 0,
    };
  }
  
  return raidDoc.data();
};

/**
 * Update raid boss
 * @deprecated Use raidService instead
 */
const updateRaidBoss = async (updates) => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const admin = require('firebase-admin');
  
  await db.collection('raidBosses').doc('current').update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return getRaidBoss();
};

/**
 * Get quests for a user
 * @deprecated Use questService instead
 */
const getQuests = async (userId) => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const questsRef = db.collection('users').doc(userId).collection('quests');
  const snapshot = await questsRef.get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update quest
 * @deprecated Use questService instead
 */
const updateQuest = async (userId, questId, updates) => {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  const admin = require('firebase-admin');
  
  await db.collection('users').doc(userId).collection('quests').doc(questId).update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// Export for CommonJS (Node.js server)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getFirestoreAdmin,
    getUser,
    updateUser,
    getRaidBoss,
    updateRaidBoss,
    getQuests,
    updateQuest,
  };
}

// Export for ES modules (if needed)
export {
  getFirestoreAdmin,
  getUser,
  updateUser,
  getRaidBoss,
  updateRaidBoss,
  getQuests,
  updateQuest,
};
