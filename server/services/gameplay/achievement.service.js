/**
 * Achievement Service - Track and manage user achievements
 * Achievements are unlocked based on user activity and milestones
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
 * Get user achievements collection reference
 */
function getUserAchievementsCollection(userId) {
  const firestore = initFirestore();
  return firestore.collection('users').doc(userId).collection('achievements');
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

const ACHIEVEMENTS = {
  // Workout achievements
  first_workout: {
    id: 'first_workout',
    name: 'First Blood',
    description: 'Complete your first workout',
    icon: 'trophy',
    category: 'workout',
    trigger: { type: 'total_workouts', value: 1 },
    xpReward: 50,
  },
  workout_10: {
    id: 'workout_10',
    name: 'Getting Warmed Up',
    description: 'Complete 10 workouts',
    icon: 'dumbbell',
    category: 'workout',
    trigger: { type: 'total_workouts', value: 10 },
    xpReward: 100,
  },
  workout_50: {
    id: 'workout_50',
    name: 'Dedicated Athlete',
    description: 'Complete 50 workouts',
    icon: 'medal',
    category: 'workout',
    trigger: { type: 'total_workouts', value: 50 },
    xpReward: 300,
  },
  workout_100: {
    id: 'workout_100',
    name: 'Centurion',
    description: 'Complete 100 workouts',
    icon: 'crown',
    category: 'workout',
    trigger: { type: 'total_workouts', value: 100 },
    xpReward: 500,
  },
  workout_500: {
    id: 'workout_500',
    name: 'Iron Will',
    description: 'Complete 500 workouts',
    icon: 'gem',
    category: 'workout',
    trigger: { type: 'total_workouts', value: 500 },
    xpReward: 1000,
  },
  
  // Rep achievements
  reps_1k: {
    id: 'reps_1k',
    name: 'Rep Counter',
    description: 'Complete 1,000 total reps',
    icon: 'counter',
    category: 'reps',
    trigger: { type: 'lifetime_reps', value: 1000 },
    xpReward: 200,
  },
  reps_10k: {
    id: 'reps_10k',
    name: 'Rep Master',
    description: 'Complete 10,000 total reps',
    icon: 'star',
    category: 'reps',
    trigger: { type: 'lifetime_reps', value: 10000 },
    xpReward: 500,
  },
  reps_100k: {
    id: 'reps_100k',
    name: 'Rep Legend',
    description: 'Complete 100,000 total reps',
    icon: 'legend',
    category: 'reps',
    trigger: { type: 'lifetime_reps', value: 100000 },
    xpReward: 2000,
  },
  
  // Streak achievements
  streak_3: {
    id: 'streak_3',
    name: 'Consistency',
    description: 'Maintain a 3-day workout streak',
    icon: 'flame',
    category: 'streak',
    trigger: { type: 'workout_streak', value: 3 },
    xpReward: 100,
  },
  streak_7: {
    id: 'streak_7',
    name: 'Streak Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: 'fire',
    category: 'streak',
    trigger: { type: 'workout_streak', value: 7 },
    xpReward: 250,
  },
  streak_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day workout streak',
    icon: 'phoenix',
    category: 'streak',
    trigger: { type: 'workout_streak', value: 30 },
    xpReward: 1000,
  },
  streak_100: {
    id: 'streak_100',
    name: 'Living Legend',
    description: 'Maintain a 100-day workout streak',
    icon: 'lightning',
    category: 'streak',
    trigger: { type: 'workout_streak', value: 100 },
    xpReward: 5000,
  },
  
  // Level achievements
  level_5: {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: 'level-up',
    category: 'level',
    trigger: { type: 'user_level', value: 5 },
    xpReward: 100,
  },
  level_10: {
    id: 'level_10',
    name: 'Experienced',
    description: 'Reach level 10',
    icon: 'star-half',
    category: 'level',
    trigger: { type: 'user_level', value: 10 },
    xpReward: 200,
  },
  level_25: {
    id: 'level_25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: 'sword',
    category: 'level',
    trigger: { type: 'user_level', value: 25 },
    xpReward: 500,
  },
  level_50: {
    id: 'level_50',
    name: 'Elite',
    description: 'Reach level 50',
    icon: 'shield',
    category: 'level',
    trigger: { type: 'user_level', value: 50 },
    xpReward: 1000,
  },
  
  // Social achievements
  first_duel: {
    id: 'first_duel',
    name: 'Challenger',
    description: 'Win your first duel',
    icon: 'crossed-swords',
    category: 'social',
    trigger: { type: 'duel_wins', value: 1 },
    xpReward: 100,
  },
  duel_master: {
    id: 'duel_master',
    name: 'Duel Master',
    description: 'Win 10 duels',
    icon: 'trophy-gold',
    category: 'social',
    trigger: { type: 'duel_wins', value: 10 },
    xpReward: 500,
  },
  club_founder: {
    id: 'club_founder',
    name: 'Club Founder',
    description: 'Create a club',
    icon: 'banner',
    category: 'social',
    trigger: { type: 'clubs_founded', value: 1 },
    xpReward: 200,
  },
  territory_conqueror: {
    id: 'territory_conqueror',
    name: 'Territory Conqueror',
    description: 'Capture 10 gym territories',
    icon: 'map',
    category: 'social',
    trigger: { type: 'territories_captured', value: 10 },
    xpReward: 500,
  },
  
  // Raid achievements
  first_raid: {
    id: 'first_raid',
    name: 'Raider',
    description: 'Complete your first raid boss',
    icon: 'dragon',
    category: 'raid',
    trigger: { type: 'raids_completed', value: 1 },
    xpReward: 150,
  },
  raid_veteran: {
    id: 'raid_veteran',
    name: 'Raid Veteran',
    description: 'Complete 10 raid bosses',
    icon: 'boss',
    category: 'raid',
    trigger: { type: 'raids_completed', value: 10 },
    xpReward: 500,
  },
  boss_slayer: {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Deal 10,000 total damage to raid bosses',
    icon: 'damage',
    category: 'raid',
    trigger: { type: 'total_raid_damage', value: 10000 },
    xpReward: 750,
  },
  mvp: {
    id: 'mvp',
    name: 'MVP',
    description: 'Be the top contributor in 5 raids',
    icon: 'medal-gold',
    category: 'raid',
    trigger: { type: 'raid_mvps', value: 5 },
    xpReward: 1000,
  },
  
  // Party achievements
  party_starter: {
    id: 'party_starter',
    name: 'Party Starter',
    description: 'Create a party',
    icon: 'party',
    category: 'party',
    trigger: { type: 'parties_created', value: 1 },
    xpReward: 100,
  },
  team_player: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Complete 5 raids with a party',
    icon: 'team',
    category: 'party',
    trigger: { type: 'party_raids', value: 5 },
    xpReward: 300,
  },
};

// ============================================================================
// ACHIEVEMENT MANAGEMENT
// ============================================================================

/**
 * Get all achievements with user unlock status
 */
async function getUserAchievements(userId) {
  try {
    const userAchievementsRef = getUserAchievementsCollection(userId);
    const snapshot = await userAchievementsRef.get();
    
    const unlockedMap = new Map();
    snapshot.docs.forEach(doc => {
      unlockedMap.set(doc.id, doc.data());
    });
    
    const achievements = Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id)?.unlockedAt || null,
    }));
    
    return achievements;
  } catch (error) {
    logger.error('Error getting user achievements', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get only unlocked achievements
 */
async function getUnlockedAchievements(userId) {
  try {
    const userAchievementsRef = getUserAchievementsCollection(userId);
    const snapshot = await userAchievementsRef.get();
    
    return snapshot.docs.map(doc => ({
      ...ACHIEVEMENTS[doc.id],
      ...doc.data(),
    }));
  } catch (error) {
    logger.error('Error getting unlocked achievements', { error: error.message, userId });
    throw error;
  }
}

/**
 * Check if achievement is already unlocked
 */
async function isAchievementUnlocked(userId, achievementId) {
  try {
    const userAchievementsRef = getUserAchievementsCollection(userId);
    const doc = await userAchievementsRef.doc(achievementId).get();
    return doc.exists;
  } catch (error) {
    logger.error('Error checking achievement', { error: error.message, userId, achievementId });
    return false;
  }
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(userId, achievementId) {
  try {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      throw new Error('Achievement not found');
    }
    
    // Check if already unlocked
    if (await isAchievementUnlocked(userId, achievementId)) {
      return null;
    }
    
    const userAchievementsRef = getUserAchievementsCollection(userId);
    
    const unlockedAchievement = {
      achievementId,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userAchievementsRef.doc(achievementId).set(unlockedAchievement);
    
    logger.info('Achievement unlocked', { 
      userId, 
      achievementId, 
      achievementName: achievement.name,
      xpReward: achievement.xpReward,
    });
    
    return {
      ...achievement,
      unlockedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error unlocking achievement', { error: error.message, userId, achievementId });
    throw error;
  }
}

/**
 * Check achievements based on user stats and unlock any that are met
 */
async function checkAndUnlockAchievements(userId, userStats) {
  const unlockedAchievements = [];
  
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    const { trigger } = achievement;
    let shouldUnlock = false;
    
    switch (trigger.type) {
      case 'total_workouts':
        shouldUnlock = (userStats.totalWorkouts || 0) >= trigger.value;
        break;
      case 'lifetime_reps':
        shouldUnlock = (userStats.lifetimeReps || 0) >= trigger.value;
        break;
      case 'workout_streak':
        shouldUnlock = (userStats.workoutStreak || 0) >= trigger.value;
        break;
      case 'user_level':
        shouldUnlock = (userStats.level || 1) >= trigger.value;
        break;
      case 'duel_wins':
        shouldUnlock = (userStats.duelWins || 0) >= trigger.value;
        break;
      case 'raids_completed':
        shouldUnlock = (userStats.raidsCompleted || 0) >= trigger.value;
        break;
      case 'total_raid_damage':
        shouldUnlock = (userStats.totalRaidDamage || 0) >= trigger.value;
        break;
      case 'raid_mvps':
        shouldUnlock = (userStats.raidMvps || 0) >= trigger.value;
        break;
      case 'territories_captured':
        shouldUnlock = (userStats.territoriesCaptured || 0) >= trigger.value;
        break;
      case 'clubs_founded':
        shouldUnlock = (userStats.clubsFounded || 0) >= trigger.value;
        break;
      case 'parties_created':
        shouldUnlock = (userStats.partiesCreated || 0) >= trigger.value;
        break;
      case 'party_raids':
        shouldUnlock = (userStats.partyRaids || 0) >= trigger.value;
        break;
    }
    
    if (shouldUnlock) {
      const unlocked = await unlockAchievement(userId, achievement.id);
      if (unlocked) {
        unlockedAchievements.push(unlocked);
      }
    }
  }
  
  return unlockedAchievements;
}

/**
 * Process workout and check for achievements
 */
async function processWorkoutForAchievements(userId, userStats) {
  return checkAndUnlockAchievements(userId, userStats);
}

/**
 * Get achievement progress for a user
 */
async function getAchievementProgress(userId, userStats) {
  const progress = [];
  
  for (const achievement of Object.values(ACHIEVEMENTS)) {
    const { trigger } = achievement;
    let current = 0;
    
    switch (trigger.type) {
      case 'total_workouts':
        current = userStats.totalWorkouts || 0;
        break;
      case 'lifetime_reps':
        current = userStats.lifetimeReps || 0;
        break;
      case 'workout_streak':
        current = userStats.workoutStreak || 0;
        break;
      case 'user_level':
        current = userStats.level || 1;
        break;
      case 'duel_wins':
        current = userStats.duelWins || 0;
        break;
      case 'raids_completed':
        current = userStats.raidsCompleted || 0;
        break;
      case 'total_raid_damage':
        current = userStats.totalRaidDamage || 0;
        break;
    }
    
    const isUnlocked = await isAchievementUnlocked(userId, achievement.id);
    
    progress.push({
      ...achievement,
      current,
      target: trigger.value,
      progress: Math.min((current / trigger.value) * 100, 100),
      unlocked: isUnlocked,
    });
  }
  
  return progress;
}

/**
 * Get achievement statistics
 */
async function getAchievementStats(userId) {
  try {
    const achievements = await getUserAchievements(userId);
    const unlocked = achievements.filter(a => a.unlocked);
    
    return {
      total: achievements.length,
      unlocked: unlocked.length,
      percentage: Math.round((unlocked.length / achievements.length) * 100),
      totalXpEarned: unlocked.reduce((sum, a) => sum + (a.xpReward || 0), 0),
      byCategory: Object.keys(ACHIEVEMENTS).reduce((acc, key) => {
        const achievement = ACHIEVEMENTS[key];
        if (!acc[achievement.category]) {
          acc[achievement.category] = { total: 0, unlocked: 0 };
        }
        acc[achievement.category].total++;
        if (achievements.find(a => a.id === achievement.id && a.unlocked)) {
          acc[achievement.category].unlocked++;
        }
        return acc;
      }, {}),
    };
  } catch (error) {
    logger.error('Error getting achievement stats', { error: error.message, userId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ACHIEVEMENTS,
  getUserAchievements,
  getUnlockedAchievements,
  unlockAchievement,
  checkAndUnlockAchievements,
  processWorkoutForAchievements,
  getAchievementProgress,
  getAchievementStats,
};


