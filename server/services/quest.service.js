/**
 * Quest Service - Dynamic quest generation and management
 * Generates personalized quests based on user data and activity
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
 * Get quests collection reference
 */
function getQuestsCollection() {
  const firestore = initFirestore();
  return firestore.collection('quests');
}

/**
 * Get user quests collection reference
 */
function getUserQuestsCollection(userId) {
  const firestore = initFirestore();
  return firestore.collection('users').doc(userId).collection('quests');
}

// ============================================================================
// QUEST TEMPLATES - Base templates for dynamic quest generation
// ============================================================================

const QUEST_TEMPLATES = {
  // Daily quests
  daily: [
    {
      id: 'daily_workout',
      title: 'Daily Dedication',
      description: 'Complete any workout today',
      type: 'daily',
      difficulty: 'easy',
      xpReward: 50,
      requirement: { type: 'workout_count', value: 1 },
      rewardItem: 'daily_loot_box',
    },
    {
      id: 'daily_reps',
      title: 'Rep Counter',
      description: 'Complete {target} total reps today',
      type: 'daily',
      difficulty: 'normal',
      xpReward: 75,
      requirement: { type: 'total_reps', value: [50, 75, 100] }, // Scaled by level
      rewardItem: null,
    },
    {
      id: 'daily_squats',
      title: 'Squat Challenge',
      description: 'Complete {target} squats today',
      type: 'daily',
      difficulty: 'normal',
      xpReward: 60,
      requirement: { type: 'exercise_reps', exercise: 'squat', value: [20, 30, 40] },
      rewardItem: null,
    },
    {
      id: 'daily_pushups',
      title: 'Push-up Power',
      description: 'Complete {target} push-ups today',
      type: 'daily',
      difficulty: 'normal',
      xpReward: 60,
      requirement: { type: 'exercise_reps', exercise: 'pushup', value: [15, 25, 35] },
      rewardItem: null,
    },
    {
      id: 'daily_raid_damage',
      title: 'Raid Warrior',
      description: 'Deal {target} damage to a raid boss',
      type: 'daily',
      difficulty: 'hard',
      xpReward: 100,
      requirement: { type: 'raid_damage', value: [100, 200, 300] },
      rewardItem: 'raid_token',
    },
  ],
  
  // Weekly quests
  weekly: [
    {
      id: 'weekly_workout_streak',
      title: 'Week Warrior',
      description: 'Work out {target} days this week',
      type: 'weekly',
      difficulty: 'hard',
      xpReward: 300,
      requirement: { type: 'workout_days', value: [5, 6, 7] },
      rewardItem: 'weekly_loot_box',
    },
    {
      id: 'weekly_total_reps',
      title: 'Rep Master',
      description: 'Complete {target} total reps this week',
      type: 'weekly',
      difficulty: 'hard',
      xpReward: 350,
      requirement: { type: 'total_reps', value: [500, 750, 1000] },
      rewardItem: null,
    },
    {
      id: 'weekly_variety',
      title: 'Variety Pack',
      description: 'Complete 3 different exercise types this week',
      type: 'weekly',
      difficulty: 'normal',
      xpReward: 200,
      requirement: { type: 'exercise_variety', value: 3 },
      rewardItem: null,
    },
    {
      id: 'weekly_duel',
      title: 'Duelist',
      description: 'Win a duel this week',
      type: 'weekly',
      difficulty: 'hard',
      xpReward: 250,
      requirement: { type: 'duel_wins', value: 1 },
      rewardItem: 'duel_trophy',
    },
  ],
  
  // Milestone quests (one-time achievements)
  milestone: [
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first workout',
      type: 'milestone',
      difficulty: 'easy',
      xpReward: 100,
      requirement: { type: 'total_workouts', value: 1 },
      rewardItem: 'training_shoes',
    },
    {
      id: 'centurion',
      title: 'Centurion',
      description: 'Complete 100 total workouts',
      type: 'milestone',
      difficulty: 'legendary',
      xpReward: 1000,
      requirement: { type: 'total_workouts', value: 100 },
      rewardItem: 'centurion_badge',
    },
    {
      id: 'rep_master_1k',
      title: 'Rep Master',
      description: 'Complete 1,000 total reps',
      type: 'milestone',
      difficulty: 'hard',
      xpReward: 500,
      requirement: { type: 'lifetime_reps', value: 1000 },
      rewardItem: 'weight_belt',
    },
    {
      id: 'rep_legend_10k',
      title: 'Rep Legend',
      description: 'Complete 10,000 total reps',
      type: 'milestone',
      difficulty: 'legendary',
      xpReward: 2000,
      requirement: { type: 'lifetime_reps', value: 10000 },
      rewardItem: 'legendary_gloves',
    },
    {
      id: 'streak_master_7',
      title: 'Streak Master',
      description: 'Maintain a 7-day workout streak',
      type: 'milestone',
      difficulty: 'hard',
      xpReward: 400,
      requirement: { type: 'workout_streak', value: 7 },
      rewardItem: 'streak_ring',
    },
    {
      id: 'streak_legend_30',
      title: 'Streak Legend',
      description: 'Maintain a 30-day workout streak',
      type: 'milestone',
      difficulty: 'legendary',
      xpReward: 1500,
      requirement: { type: 'workout_streak', value: 30 },
      rewardItem: 'champion_cape',
    },
    {
      id: 'raid_slayer',
      title: 'Raid Slayer',
      description: 'Defeat 5 raid bosses',
      type: 'milestone',
      difficulty: 'hard',
      xpReward: 600,
      requirement: { type: 'raids_completed', value: 5 },
      rewardItem: 'raid_armor',
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Join a club and participate in 3 territory battles',
      type: 'milestone',
      difficulty: 'normal',
      xpReward: 300,
      requirement: { type: 'territory_battles', value: 3 },
      rewardItem: 'friendship_ring',
    },
    {
      id: 'level_10',
      title: 'Rising Star',
      description: 'Reach level 10',
      type: 'milestone',
      difficulty: 'hard',
      xpReward: 500,
      requirement: { type: 'user_level', value: 10 },
      rewardItem: 'star_badge',
    },
    {
      id: 'level_25',
      title: 'Veteran',
      description: 'Reach level 25',
      type: 'milestone',
      difficulty: 'legendary',
      xpReward: 1000,
      requirement: { type: 'user_level', value: 25 },
      rewardItem: 'veteran_armor',
    },
  ],
  
  // Special event quests
  special: [
    {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Complete a workout before 7 AM',
      type: 'special',
      difficulty: 'normal',
      xpReward: 150,
      requirement: { type: 'early_workout', value: 1 },
      rewardItem: 'sunrise_cape',
    },
    {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Complete a workout after 9 PM',
      type: 'special',
      difficulty: 'normal',
      xpReward: 150,
      requirement: { type: 'late_workout', value: 1 },
      rewardItem: 'moonlight_gloves',
    },
  ],
};

// ============================================================================
// QUEST GENERATION
// ============================================================================

/**
 * Get scaled value based on user level
 */
function getScaledValue(values, userLevel) {
  if (!Array.isArray(values)) return values;
  
  if (userLevel < 5) return values[0];
  if (userLevel < 15) return values[1];
  return values[2];
}

/**
 * Generate quest instance from template
 */
function generateQuestInstance(template, user) {
  const userLevel = user.level || 1;
  const scaledValue = getScaledValue(template.requirement.value, userLevel);
  
  return {
    ...template,
    id: `${template.id}_${Date.now()}`,
    templateId: template.id,
    userId: user.uid,
    requirement: {
      ...template.requirement,
      value: scaledValue,
      target: scaledValue,
    },
    description: template.description.replace('{target}', scaledValue.toString()),
    progress: 0,
    completed: false,
    claimed: false,
    createdAt: new Date().toISOString(),
    expiresAt: template.type === 'daily' 
      ? getEndOfDay() 
      : template.type === 'weekly'
        ? getEndOfWeek()
        : null,
  };
}

/**
 * Get end of current day
 */
function getEndOfDay() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

/**
 * Get end of current week (Sunday)
 */
function getEndOfWeek() {
  const end = new Date();
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

/**
 * Generate daily quests for a user
 */
async function generateDailyQuests(user) {
  const templates = QUEST_TEMPLATES.daily;
  
  // Select 3 random daily quests
  const shuffled = [...templates].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  return selected.map(template => generateQuestInstance(template, user));
}

/**
 * Generate weekly quests for a user
 */
async function generateWeeklyQuests(user) {
  const templates = QUEST_TEMPLATES.weekly;
  
  // Select 2 random weekly quests
  const shuffled = [...templates].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 2);
  
  return selected.map(template => generateQuestInstance(template, user));
}

/**
 * Get available milestone quests for a user
 */
async function getAvailableMilestoneQuests(user) {
  try {
    const userQuestsRef = getUserQuestsCollection(user.uid);
    const completedSnapshot = await userQuestsRef
      .where('type', '==', 'milestone')
      .where('completed', '==', true)
      .get();
    
    const completedIds = completedSnapshot.docs.map(doc => doc.data().templateId);
    
    // Get user stats for filtering available quests
    const userStats = await getUserStats(user.uid);
    
    const availableQuests = QUEST_TEMPLATES.milestone
      .filter(template => !completedIds.includes(template.id))
      .map(template => generateQuestInstance(template, user))
      .map(quest => ({
        ...quest,
        progress: calculateProgress(quest, userStats),
      }));
    
    return availableQuests;
  } catch (error) {
    logger.error('Error getting milestone quests', { error: error.message, userId: user.uid });
    return QUEST_TEMPLATES.milestone.map(template => generateQuestInstance(template, user));
  }
}

// ============================================================================
// QUEST MANAGEMENT
// ============================================================================

/**
 * Get user's active quests
 */
async function getUserQuests(userId) {
  try {
    const userQuestsRef = getUserQuestsCollection(userId);
    const snapshot = await userQuestsRef
      .where('completed', '==', false)
      .orderBy('createdAt', 'desc')
      .get();
    
    const now = new Date();
    const quests = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(quest => !quest.expiresAt || new Date(quest.expiresAt) > now);
    
    return quests;
  } catch (error) {
    logger.error('Error getting user quests', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get all quests for a user (including completed)
 */
async function getAllUserQuests(userId, limit = 50) {
  try {
    const userQuestsRef = getUserQuestsCollection(userId);
    const snapshot = await userQuestsRef
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logger.error('Error getting all user quests', { error: error.message, userId });
    throw error;
  }
}

/**
 * Refresh daily and weekly quests if expired
 */
async function refreshQuests(user) {
  try {
    const userQuestsRef = getUserQuestsCollection(user.uid);
    const now = new Date();
    
    // Check for expired daily quests
    const dailySnapshot = await userQuestsRef
      .where('type', '==', 'daily')
      .where('completed', '==', false)
      .get();
    
    const needsNewDailies = dailySnapshot.empty || 
      dailySnapshot.docs.every(doc => {
        const expiresAt = doc.data().expiresAt;
        return expiresAt && new Date(expiresAt) <= now;
      });
    
    // Check for expired weekly quests
    const weeklySnapshot = await userQuestsRef
      .where('type', '==', 'weekly')
      .where('completed', '==', false)
      .get();
    
    const needsNewWeeklies = weeklySnapshot.empty ||
      weeklySnapshot.docs.every(doc => {
        const expiresAt = doc.data().expiresAt;
        return expiresAt && new Date(expiresAt) <= now;
      });
    
    const newQuests = [];
    
    if (needsNewDailies) {
      const dailyQuests = await generateDailyQuests(user);
      for (const quest of dailyQuests) {
        await userQuestsRef.doc(quest.id).set(quest);
        newQuests.push(quest);
      }
      logger.info('Generated new daily quests', { userId: user.uid, count: dailyQuests.length });
    }
    
    if (needsNewWeeklies) {
      const weeklyQuests = await generateWeeklyQuests(user);
      for (const quest of weeklyQuests) {
        await userQuestsRef.doc(quest.id).set(quest);
        newQuests.push(quest);
      }
      logger.info('Generated new weekly quests', { userId: user.uid, count: weeklyQuests.length });
    }
    
    return newQuests;
  } catch (error) {
    logger.error('Error refreshing quests', { error: error.message, userId: user.uid });
    throw error;
  }
}

/**
 * Update quest progress
 */
async function updateQuestProgress(userId, questId, progressDelta) {
  try {
    const userQuestsRef = getUserQuestsCollection(userId);
    const questDoc = userQuestsRef.doc(questId);
    const snapshot = await questDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Quest not found');
    }
    
    const quest = snapshot.data();
    const newProgress = (quest.progress || 0) + progressDelta;
    const completed = newProgress >= quest.requirement.target;
    
    await questDoc.update({
      progress: newProgress,
      completed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(completed && { completedAt: admin.firestore.FieldValue.serverTimestamp() }),
    });
    
    logger.info('Quest progress updated', { 
      userId, 
      questId, 
      newProgress, 
      completed,
      target: quest.requirement.target,
    });
    
    return { ...quest, progress: newProgress, completed };
  } catch (error) {
    logger.error('Error updating quest progress', { error: error.message, userId, questId });
    throw error;
  }
}

/**
 * Process workout for quest progress
 */
async function processWorkoutForQuests(userId, workoutData) {
  try {
    const { exercise, reps } = workoutData;
    const quests = await getUserQuests(userId);
    const updates = [];
    
    for (const quest of quests) {
      let progressDelta = 0;
      
      switch (quest.requirement.type) {
        case 'workout_count':
          progressDelta = 1;
          break;
        case 'total_reps':
          progressDelta = reps;
          break;
        case 'exercise_reps':
          if (quest.requirement.exercise === exercise) {
            progressDelta = reps;
          }
          break;
        case 'exercise_variety':
          // This needs special handling - track unique exercises
          progressDelta = 0; // Handled separately
          break;
      }
      
      if (progressDelta > 0) {
        const updated = await updateQuestProgress(userId, quest.id, progressDelta);
        updates.push(updated);
      }
    }
    
    return updates;
  } catch (error) {
    logger.error('Error processing workout for quests', { error: error.message, userId });
    throw error;
  }
}

/**
 * Claim quest reward
 */
async function claimQuestReward(userId, questId) {
  try {
    const userQuestsRef = getUserQuestsCollection(userId);
    const questDoc = userQuestsRef.doc(questId);
    const snapshot = await questDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Quest not found');
    }
    
    const quest = snapshot.data();
    
    if (!quest.completed) {
      throw new Error('Quest not completed');
    }
    
    if (quest.claimed) {
      throw new Error('Reward already claimed');
    }
    
    await questDoc.update({
      claimed: true,
      claimedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Quest reward claimed', { userId, questId, xpReward: quest.xpReward });
    
    return {
      xpReward: quest.xpReward,
      rewardItem: quest.rewardItem,
      quest,
    };
  } catch (error) {
    logger.error('Error claiming quest reward', { error: error.message, userId, questId });
    throw error;
  }
}

/**
 * Get user stats for quest progress calculation
 */
async function getUserStats(userId) {
  try {
    const firestore = initFirestore();
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return {
        totalWorkouts: 0,
        lifetimeReps: 0,
        workoutStreak: 0,
        raidsCompleted: 0,
        territoryBattles: 0,
        level: 1,
      };
    }
    
    const userData = userDoc.data();
    return {
      totalWorkouts: userData.totalWorkouts || 0,
      lifetimeReps: userData.lifetimeReps || 0,
      workoutStreak: userData.workoutStreak || 0,
      raidsCompleted: userData.raidsCompleted || 0,
      territoryBattles: userData.territoryBattles || 0,
      level: userData.level || 1,
    };
  } catch (error) {
    logger.error('Error getting user stats', { error: error.message, userId });
    return {};
  }
}

/**
 * Calculate progress for a quest based on user stats
 */
function calculateProgress(quest, userStats) {
  switch (quest.requirement.type) {
    case 'total_workouts':
      return userStats.totalWorkouts || 0;
    case 'lifetime_reps':
      return userStats.lifetimeReps || 0;
    case 'workout_streak':
      return userStats.workoutStreak || 0;
    case 'raids_completed':
      return userStats.raidsCompleted || 0;
    case 'territory_battles':
      return userStats.territoryBattles || 0;
    case 'user_level':
      return userStats.level || 1;
    default:
      return 0;
  }
}

/**
 * Initialize quests for a new user
 */
async function initializeUserQuests(user) {
  try {
    const dailyQuests = await generateDailyQuests(user);
    const weeklyQuests = await generateWeeklyQuests(user);
    const milestoneQuests = QUEST_TEMPLATES.milestone
      .slice(0, 3) // Start with first 3 milestones visible
      .map(template => generateQuestInstance(template, user));
    
    const userQuestsRef = getUserQuestsCollection(user.uid);
    
    const allQuests = [...dailyQuests, ...weeklyQuests, ...milestoneQuests];
    
    for (const quest of allQuests) {
      await userQuestsRef.doc(quest.id).set(quest);
    }
    
    logger.info('Initialized user quests', { userId: user.uid, questCount: allQuests.length });
    
    return allQuests;
  } catch (error) {
    logger.error('Error initializing user quests', { error: error.message, userId: user.uid });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  QUEST_TEMPLATES,
  getUserQuests,
  getAllUserQuests,
  refreshQuests,
  updateQuestProgress,
  processWorkoutForQuests,
  claimQuestReward,
  initializeUserQuests,
  generateDailyQuests,
  generateWeeklyQuests,
  getAvailableMilestoneQuests,
};

