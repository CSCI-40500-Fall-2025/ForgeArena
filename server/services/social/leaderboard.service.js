/**
 * Leaderboard Service - Real-time leaderboards from actual user data
 * Provides various leaderboard types: XP, level, weekly XP, streaks, etc.
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;

/**
 * Initialize Firestore connection
 */
function initFirestore() {
  if (db) return db;
  
  if (admin.apps.length) {
    db = admin.firestore();
    return db;
  }
  
  throw new Error('Firestore not initialized. Initialize user service first.');
}

/**
 * Get users collection reference
 */
function getUsersCollection() {
  const firestore = initFirestore();
  return firestore.collection('users');
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

const LEADERBOARD_TYPES = {
  LEVEL: 'level',
  XP: 'xp',
  WEEKLY_XP: 'weekly_xp',
  STREAK: 'streak',
  TOTAL_WORKOUTS: 'total_workouts',
  LIFETIME_REPS: 'lifetime_reps',
  RAIDS_COMPLETED: 'raids_completed',
  DUEL_WINS: 'duel_wins',
};

// ============================================================================
// LEADERBOARD QUERIES
// ============================================================================

/**
 * Get overall leaderboard (by level and XP)
 */
async function getOverallLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('level', 'desc')
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        xp: data.xp || 0,
        clubId: data.clubId || null,
        clubName: data.clubName || null,
      };
    });
  } catch (error) {
    logger.error('Error getting overall leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get weekly XP leaderboard
 */
async function getWeeklyLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('weeklyXP', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        weeklyXP: data.weeklyXP || 0,
        xp: data.xp || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting weekly leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get streak leaderboard
 */
async function getStreakLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('workoutStreak', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        workoutStreak: data.workoutStreak || 0,
        lastWorkout: data.lastWorkout,
      };
    });
  } catch (error) {
    logger.error('Error getting streak leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get workouts leaderboard
 */
async function getWorkoutsLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('totalWorkouts', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        totalWorkouts: data.totalWorkouts || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting workouts leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get lifetime reps leaderboard
 */
async function getRepsLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('lifetimeReps', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        lifetimeReps: data.lifetimeReps || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting reps leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get raid completions leaderboard
 */
async function getRaidLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('raidsCompleted', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        raidsCompleted: data.raidsCompleted || 0,
        totalRaidDamage: data.totalRaidDamage || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting raid leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get duel wins leaderboard
 */
async function getDuelLeaderboard(limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .orderBy('duelWins', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        duelWins: data.duelWins || 0,
        duelLosses: data.duelLosses || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting duel leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get gym-specific leaderboard
 */
async function getGymLeaderboard(gym, limit = 20) {
  try {
    const usersRef = getUsersCollection();
    const snapshot = await usersRef
      .where('gym', '==', gym)
      .orderBy('level', 'desc')
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        username: data.username,
        handle: data.handle,
        avatarUrl: data.avatarUrl || '',
        level: data.level || 1,
        xp: data.xp || 0,
        gym: data.gym,
      };
    });
  } catch (error) {
    logger.error('Error getting gym leaderboard', { error: error.message, gym });
    throw error;
  }
}

/**
 * Get club leaderboard (by total power)
 */
async function getClubLeaderboard(limit = 20) {
  try {
    const firestore = initFirestore();
    const clubsRef = firestore.collection('clubs');
    const snapshot = await clubsRef
      .orderBy('totalPower', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: doc.id,
        name: data.name,
        tag: data.tag,
        color: data.color,
        memberCount: data.memberCount || 0,
        totalPower: data.totalPower || 0,
        territoriesControlled: data.territoriesControlled || 0,
        wins: data.wins || 0,
        losses: data.losses || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting club leaderboard', { error: error.message });
    throw error;
  }
}

/**
 * Get user's rank on a specific leaderboard
 */
async function getUserRank(userId, leaderboardType = LEADERBOARD_TYPES.LEVEL) {
  try {
    const usersRef = getUsersCollection();
    const userDoc = await usersRef.doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    let field, value;
    
    switch (leaderboardType) {
      case LEADERBOARD_TYPES.LEVEL:
        field = 'level';
        value = userData.level || 1;
        break;
      case LEADERBOARD_TYPES.XP:
        field = 'xp';
        value = userData.xp || 0;
        break;
      case LEADERBOARD_TYPES.WEEKLY_XP:
        field = 'weeklyXP';
        value = userData.weeklyXP || 0;
        break;
      case LEADERBOARD_TYPES.STREAK:
        field = 'workoutStreak';
        value = userData.workoutStreak || 0;
        break;
      case LEADERBOARD_TYPES.TOTAL_WORKOUTS:
        field = 'totalWorkouts';
        value = userData.totalWorkouts || 0;
        break;
      case LEADERBOARD_TYPES.LIFETIME_REPS:
        field = 'lifetimeReps';
        value = userData.lifetimeReps || 0;
        break;
      default:
        field = 'level';
        value = userData.level || 1;
    }
    
    // Count users with higher value
    const higherSnapshot = await usersRef
      .where(field, '>', value)
      .get();
    
    const rank = higherSnapshot.size + 1;
    
    return {
      rank,
      value,
      field,
      user: {
        id: userId,
        username: userData.username,
        handle: userData.handle,
        level: userData.level || 1,
        xp: userData.xp || 0,
      },
    };
  } catch (error) {
    logger.error('Error getting user rank', { error: error.message, userId, leaderboardType });
    throw error;
  }
}

/**
 * Get comprehensive leaderboard data for a user
 */
async function getUserLeaderboardStats(userId) {
  try {
    const [levelRank, weeklyRank, streakRank, workoutRank] = await Promise.all([
      getUserRank(userId, LEADERBOARD_TYPES.LEVEL),
      getUserRank(userId, LEADERBOARD_TYPES.WEEKLY_XP),
      getUserRank(userId, LEADERBOARD_TYPES.STREAK),
      getUserRank(userId, LEADERBOARD_TYPES.TOTAL_WORKOUTS),
    ]);
    
    return {
      overall: levelRank,
      weekly: weeklyRank,
      streak: streakRank,
      workouts: workoutRank,
    };
  } catch (error) {
    logger.error('Error getting user leaderboard stats', { error: error.message, userId });
    throw error;
  }
}

/**
 * Reset weekly XP for all users (called by scheduled job)
 */
async function resetWeeklyXP() {
  try {
    const firestore = initFirestore();
    const usersRef = getUsersCollection();
    const snapshot = await usersRef.get();
    
    const batch = firestore.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { weeklyXP: 0 });
      count++;
    });
    
    await batch.commit();
    
    logger.info('Weekly XP reset completed', { usersReset: count });
    
    return { usersReset: count };
  } catch (error) {
    logger.error('Error resetting weekly XP', { error: error.message });
    throw error;
  }
}

/**
 * Get leaderboard by type
 */
async function getLeaderboard(type, options = {}) {
  const limit = options.limit || 20;
  const gym = options.gym;
  
  switch (type) {
    case LEADERBOARD_TYPES.LEVEL:
    case LEADERBOARD_TYPES.XP:
      return gym ? getGymLeaderboard(gym, limit) : getOverallLeaderboard(limit);
    case LEADERBOARD_TYPES.WEEKLY_XP:
      return getWeeklyLeaderboard(limit);
    case LEADERBOARD_TYPES.STREAK:
      return getStreakLeaderboard(limit);
    case LEADERBOARD_TYPES.TOTAL_WORKOUTS:
      return getWorkoutsLeaderboard(limit);
    case LEADERBOARD_TYPES.LIFETIME_REPS:
      return getRepsLeaderboard(limit);
    case LEADERBOARD_TYPES.RAIDS_COMPLETED:
      return getRaidLeaderboard(limit);
    case LEADERBOARD_TYPES.DUEL_WINS:
      return getDuelLeaderboard(limit);
    default:
      return getOverallLeaderboard(limit);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  LEADERBOARD_TYPES,
  getOverallLeaderboard,
  getWeeklyLeaderboard,
  getStreakLeaderboard,
  getWorkoutsLeaderboard,
  getRepsLeaderboard,
  getRaidLeaderboard,
  getDuelLeaderboard,
  getGymLeaderboard,
  getClubLeaderboard,
  getUserRank,
  getUserLeaderboardStats,
  resetWeeklyXP,
  getLeaderboard,
};

