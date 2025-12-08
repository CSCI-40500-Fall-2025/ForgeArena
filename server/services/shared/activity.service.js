/**
 * Activity Service - Manage activity feed and social updates
 * Tracks user activities and creates a social feed
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
 * Get activities collection reference
 */
function getActivitiesCollection() {
  const firestore = initFirestore();
  return firestore.collection('activities');
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

const ACTIVITY_TYPES = {
  WORKOUT: 'workout',
  LEVEL_UP: 'level_up',
  QUEST_COMPLETE: 'quest_complete',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  DUEL_WIN: 'duel_win',
  DUEL_CHALLENGE: 'duel_challenge',
  RAID_DAMAGE: 'raid_damage',
  RAID_COMPLETE: 'raid_complete',
  CLUB_JOIN: 'club_join',
  CLUB_CREATE: 'club_create',
  TERRITORY_CAPTURE: 'territory_capture',
  PARTY_CREATE: 'party_create',
  PARTY_JOIN: 'party_join',
  ITEM_ACQUIRE: 'item_acquire',
  STREAK_MILESTONE: 'streak_milestone',
};

// ============================================================================
// ACTIVITY CREATION
// ============================================================================

/**
 * Create a new activity
 */
async function createActivity(userId, username, type, data = {}) {
  try {
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate action text based on type
    const actionText = generateActionText(type, data);
    
    const activity = {
      id: activityId,
      userId,
      username,
      type,
      action: actionText,
      data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const activitiesRef = getActivitiesCollection();
    await activitiesRef.doc(activityId).set(activity);
    
    logger.debug('Activity created', { activityId, userId, type });
    
    return {
      ...activity,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating activity', { error: error.message, userId, type });
    throw error;
  }
}

/**
 * Generate human-readable action text
 */
function generateActionText(type, data) {
  switch (type) {
    case ACTIVITY_TYPES.WORKOUT:
      return `completed ${data.reps} ${data.exercise}${data.reps > 1 ? 's' : ''}`;
    case ACTIVITY_TYPES.LEVEL_UP:
      return `leveled up to level ${data.newLevel}`;
    case ACTIVITY_TYPES.QUEST_COMPLETE:
      return `completed quest "${data.questTitle}"`;
    case ACTIVITY_TYPES.ACHIEVEMENT_UNLOCK:
      return `unlocked achievement "${data.achievementName}"`;
    case ACTIVITY_TYPES.DUEL_WIN:
      return `won a duel against ${data.opponentName}`;
    case ACTIVITY_TYPES.DUEL_CHALLENGE:
      return `challenged ${data.opponentName} to a duel`;
    case ACTIVITY_TYPES.RAID_DAMAGE:
      return `dealt ${data.damage} damage to ${data.bossName}`;
    case ACTIVITY_TYPES.RAID_COMPLETE:
      return `helped defeat ${data.bossName}`;
    case ACTIVITY_TYPES.CLUB_JOIN:
      return `joined club ${data.clubName}`;
    case ACTIVITY_TYPES.CLUB_CREATE:
      return `founded club ${data.clubName}`;
    case ACTIVITY_TYPES.TERRITORY_CAPTURE:
      return `captured ${data.gymName} for ${data.clubName}`;
    case ACTIVITY_TYPES.PARTY_CREATE:
      return `created party "${data.partyName}"`;
    case ACTIVITY_TYPES.PARTY_JOIN:
      return `joined party "${data.partyName}"`;
    case ACTIVITY_TYPES.ITEM_ACQUIRE:
      return `acquired ${data.itemName}`;
    case ACTIVITY_TYPES.STREAK_MILESTONE:
      return `reached a ${data.streakDays}-day workout streak!`;
    default:
      return `did something awesome`;
  }
}

// ============================================================================
// ACTIVITY FEEDS
// ============================================================================

/**
 * Get global activity feed
 */
async function getGlobalFeed(limit = 50) {
  try {
    const activitiesRef = getActivitiesCollection();
    const snapshot = await activitiesRef
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });
  } catch (error) {
    logger.error('Error getting global feed', { error: error.message });
    throw error;
  }
}

/**
 * Get user's activity feed
 */
async function getUserFeed(userId, limit = 20) {
  try {
    const activitiesRef = getActivitiesCollection();
    const snapshot = await activitiesRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });
  } catch (error) {
    logger.error('Error getting user feed', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get club activity feed
 */
async function getClubFeed(clubId, limit = 30) {
  try {
    // First get all members of the club
    const firestore = initFirestore();
    const membersSnapshot = await firestore.collection('users')
      .where('clubId', '==', clubId)
      .get();
    
    const memberIds = membersSnapshot.docs.map(doc => doc.id);
    
    if (memberIds.length === 0) {
      return [];
    }
    
    // Firebase doesn't support 'in' queries with more than 10 items
    // So we need to batch if there are more members
    const batches = [];
    for (let i = 0; i < memberIds.length; i += 10) {
      const batch = memberIds.slice(i, i + 10);
      batches.push(batch);
    }
    
    const activitiesRef = getActivitiesCollection();
    const allActivities = [];
    
    for (const batch of batches) {
      const snapshot = await activitiesRef
        .where('userId', 'in', batch)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        allActivities.push({
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        });
      });
    }
    
    // Sort and limit
    return allActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    logger.error('Error getting club feed', { error: error.message, clubId });
    throw error;
  }
}

/**
 * Get party activity feed
 */
async function getPartyFeed(partyId, limit = 30) {
  try {
    const firestore = initFirestore();
    
    // Get party members
    const partyDoc = await firestore.collection('parties').doc(partyId).get();
    if (!partyDoc.exists) {
      return [];
    }
    
    const party = partyDoc.data();
    const memberIds = party.members?.map(m => m.userId) || [];
    
    if (memberIds.length === 0) {
      return [];
    }
    
    const activitiesRef = getActivitiesCollection();
    const snapshot = await activitiesRef
      .where('userId', 'in', memberIds.slice(0, 10))
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });
  } catch (error) {
    logger.error('Error getting party feed', { error: error.message, partyId });
    throw error;
  }
}

/**
 * Get activities by type
 */
async function getActivitiesByType(type, limit = 20) {
  try {
    const activitiesRef = getActivitiesCollection();
    const snapshot = await activitiesRef
      .where('type', '==', type)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });
  } catch (error) {
    logger.error('Error getting activities by type', { error: error.message, type });
    throw error;
  }
}

// ============================================================================
// ACTIVITY SHORTCUTS
// ============================================================================

/**
 * Log a workout activity
 */
async function logWorkoutActivity(userId, username, exercise, reps) {
  return createActivity(userId, username, ACTIVITY_TYPES.WORKOUT, { exercise, reps });
}

/**
 * Log a level up activity
 */
async function logLevelUpActivity(userId, username, newLevel) {
  return createActivity(userId, username, ACTIVITY_TYPES.LEVEL_UP, { newLevel });
}

/**
 * Log quest completion
 */
async function logQuestCompleteActivity(userId, username, questTitle, xpReward) {
  return createActivity(userId, username, ACTIVITY_TYPES.QUEST_COMPLETE, { questTitle, xpReward });
}

/**
 * Log achievement unlock
 */
async function logAchievementUnlockActivity(userId, username, achievementName) {
  return createActivity(userId, username, ACTIVITY_TYPES.ACHIEVEMENT_UNLOCK, { achievementName });
}

/**
 * Log duel win
 */
async function logDuelWinActivity(userId, username, opponentName) {
  return createActivity(userId, username, ACTIVITY_TYPES.DUEL_WIN, { opponentName });
}

/**
 * Log duel challenge
 */
async function logDuelChallengeActivity(userId, username, opponentName) {
  return createActivity(userId, username, ACTIVITY_TYPES.DUEL_CHALLENGE, { opponentName });
}

/**
 * Log raid damage
 */
async function logRaidDamageActivity(userId, username, damage, bossName) {
  // Only log significant damage (> 100)
  if (damage < 100) return null;
  return createActivity(userId, username, ACTIVITY_TYPES.RAID_DAMAGE, { damage, bossName });
}

/**
 * Log raid completion
 */
async function logRaidCompleteActivity(userId, username, bossName) {
  return createActivity(userId, username, ACTIVITY_TYPES.RAID_COMPLETE, { bossName });
}

/**
 * Log club join
 */
async function logClubJoinActivity(userId, username, clubName) {
  return createActivity(userId, username, ACTIVITY_TYPES.CLUB_JOIN, { clubName });
}

/**
 * Log club creation
 */
async function logClubCreateActivity(userId, username, clubName) {
  return createActivity(userId, username, ACTIVITY_TYPES.CLUB_CREATE, { clubName });
}

/**
 * Log territory capture
 */
async function logTerritoryCaptureActivity(userId, username, gymName, clubName) {
  return createActivity(userId, username, ACTIVITY_TYPES.TERRITORY_CAPTURE, { gymName, clubName });
}

/**
 * Log streak milestone
 */
async function logStreakMilestoneActivity(userId, username, streakDays) {
  // Only log milestone streaks (3, 7, 14, 30, etc.)
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  if (!milestones.includes(streakDays)) return null;
  return createActivity(userId, username, ACTIVITY_TYPES.STREAK_MILESTONE, { streakDays });
}

// ============================================================================
// ACTIVITY CLEANUP
// ============================================================================

/**
 * Clean up old activities (keep last 30 days)
 */
async function cleanupOldActivities() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const activitiesRef = getActivitiesCollection();
    const snapshot = await activitiesRef
      .where('timestamp', '<', cutoffDate)
      .limit(500) // Process in batches
      .get();
    
    if (snapshot.empty) {
      logger.info('No old activities to clean up');
      return { deleted: 0 };
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info('Cleaned up old activities', { deleted: snapshot.size });
    
    return { deleted: snapshot.size };
  } catch (error) {
    logger.error('Error cleaning up activities', { error: error.message });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ACTIVITY_TYPES,
  createActivity,
  getGlobalFeed,
  getUserFeed,
  getClubFeed,
  getPartyFeed,
  getActivitiesByType,
  logWorkoutActivity,
  logLevelUpActivity,
  logQuestCompleteActivity,
  logAchievementUnlockActivity,
  logDuelWinActivity,
  logDuelChallengeActivity,
  logRaidDamageActivity,
  logRaidCompleteActivity,
  logClubJoinActivity,
  logClubCreateActivity,
  logTerritoryCaptureActivity,
  logStreakMilestoneActivity,
  cleanupOldActivities,
};

