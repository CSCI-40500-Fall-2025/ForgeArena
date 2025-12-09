/**
 * Duel Service - Manage 1v1 challenges between users
 * Duels are workout-based competitions with various challenge types
 */

const admin = require('firebase-admin');
const logger = require('../../utils/logger');

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
 * Get duels collection reference
 */
function getDuelsCollection() {
  const firestore = initFirestore();
  return firestore.collection('duels');
}

// ============================================================================
// DUEL TYPES AND CHALLENGES
// ============================================================================

const DUEL_CHALLENGES = {
  squats_24h: {
    id: 'squats_24h',
    name: 'Most squats in 24h',
    exercise: 'squat',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    metric: 'total_reps',
    xpReward: { winner: 150, loser: 50 },
  },
  pushups_1h: {
    id: 'pushups_1h',
    name: 'Most push-ups in 1h',
    exercise: 'pushup',
    duration: 60 * 60 * 1000, // 1 hour
    metric: 'total_reps',
    xpReward: { winner: 100, loser: 25 },
  },
  pullups_24h: {
    id: 'pullups_24h',
    name: 'Most pull-ups in 24h',
    exercise: 'pullup',
    duration: 24 * 60 * 60 * 1000,
    metric: 'total_reps',
    xpReward: { winner: 175, loser: 50 },
  },
  total_reps_week: {
    id: 'total_reps_week',
    name: 'Most total reps this week',
    exercise: null, // Any exercise
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week
    metric: 'total_reps',
    xpReward: { winner: 300, loser: 100 },
  },
  workouts_week: {
    id: 'workouts_week',
    name: 'Most workouts this week',
    exercise: null,
    duration: 7 * 24 * 60 * 60 * 1000,
    metric: 'workout_count',
    xpReward: { winner: 250, loser: 75 },
  },
};

const DUEL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DECLINED: 'declined',
  EXPIRED: 'expired',
};

// ============================================================================
// DUEL MANAGEMENT
// ============================================================================

/**
 * Get available duel challenges
 */
function getAvailableChallenges() {
  return Object.values(DUEL_CHALLENGES);
}

/**
 * Create a new duel challenge
 */
async function createDuel(challengerId, challengerUsername, opponentUsername, challengeType) {
  try {
    const challenge = DUEL_CHALLENGES[challengeType];
    if (!challenge) {
      throw new Error('Invalid challenge type');
    }
    
    // Find opponent by username
    const firestore = initFirestore();
    const usersSnapshot = await firestore.collection('users')
      .where('username', '==', opponentUsername)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      throw new Error('Opponent not found');
    }
    
    const opponentDoc = usersSnapshot.docs[0];
    const opponent = { id: opponentDoc.id, ...opponentDoc.data() };
    
    if (opponent.id === challengerId) {
      throw new Error('Cannot challenge yourself');
    }
    
    // Create duel record
    const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newDuel = {
      id: duelId,
      challengeType,
      challengeName: challenge.name,
      exercise: challenge.exercise,
      duration: challenge.duration,
      metric: challenge.metric,
      xpReward: challenge.xpReward,
      
      challenger: {
        id: challengerId,
        username: challengerUsername,
        score: 0,
      },
      opponent: {
        id: opponent.id,
        username: opponent.username,
        score: 0,
      },
      
      status: DUEL_STATUS.PENDING,
      winner: null,
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: null, // Set when accepted
      startedAt: null,
      completedAt: null,
    };
    
    const duelsRef = getDuelsCollection();
    await duelsRef.doc(duelId).set(newDuel);
    
    logger.info('Duel created', { 
      duelId, 
      challenger: challengerUsername, 
      opponent: opponentUsername,
      challengeType,
    });
    
    return {
      ...newDuel,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating duel', { error: error.message, challengerId });
    throw error;
  }
}

/**
 * Accept a duel challenge
 */
async function acceptDuel(userId, duelId) {
  try {
    const duelsRef = getDuelsCollection();
    const duelDoc = duelsRef.doc(duelId);
    const snapshot = await duelDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Duel not found');
    }
    
    const duel = snapshot.data();
    
    if (duel.opponent.id !== userId) {
      throw new Error('Only the challenged user can accept');
    }
    
    if (duel.status !== DUEL_STATUS.PENDING) {
      throw new Error('Duel is no longer pending');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duel.duration);
    
    await duelDoc.update({
      status: DUEL_STATUS.ACTIVE,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    });
    
    logger.info('Duel accepted', { duelId, acceptedBy: userId });
    
    return {
      ...duel,
      status: DUEL_STATUS.ACTIVE,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    logger.error('Error accepting duel', { error: error.message, userId, duelId });
    throw error;
  }
}

/**
 * Decline a duel challenge
 */
async function declineDuel(userId, duelId) {
  try {
    const duelsRef = getDuelsCollection();
    const duelDoc = duelsRef.doc(duelId);
    const snapshot = await duelDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Duel not found');
    }
    
    const duel = snapshot.data();
    
    if (duel.opponent.id !== userId) {
      throw new Error('Only the challenged user can decline');
    }
    
    if (duel.status !== DUEL_STATUS.PENDING) {
      throw new Error('Duel is no longer pending');
    }
    
    await duelDoc.update({
      status: DUEL_STATUS.DECLINED,
      declinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Duel declined', { duelId, declinedBy: userId });
    
    return { message: 'Duel declined' };
  } catch (error) {
    logger.error('Error declining duel', { error: error.message, userId, duelId });
    throw error;
  }
}

/**
 * Update duel score (from workout)
 */
async function updateDuelScore(userId, duelId, scoreDelta) {
  try {
    const duelsRef = getDuelsCollection();
    const duelDoc = duelsRef.doc(duelId);
    const snapshot = await duelDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Duel not found');
    }
    
    const duel = snapshot.data();
    
    if (duel.status !== DUEL_STATUS.ACTIVE) {
      throw new Error('Duel is not active');
    }
    
    // Check if duel has expired
    if (new Date(duel.expiresAt) <= new Date()) {
      await completeDuel(duelId);
      throw new Error('Duel has expired');
    }
    
    // Update the correct player's score
    const isChallenger = duel.challenger.id === userId;
    const field = isChallenger ? 'challenger.score' : 'opponent.score';
    const currentScore = isChallenger ? duel.challenger.score : duel.opponent.score;
    
    await duelDoc.update({
      [field]: currentScore + scoreDelta,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Duel score updated', { 
      duelId, 
      userId, 
      scoreDelta, 
      newScore: currentScore + scoreDelta,
    });
    
    return {
      duelId,
      newScore: currentScore + scoreDelta,
      isChallenger,
    };
  } catch (error) {
    logger.error('Error updating duel score', { error: error.message, userId, duelId });
    throw error;
  }
}

/**
 * Complete a duel and determine winner
 */
async function completeDuel(duelId) {
  try {
    const duelsRef = getDuelsCollection();
    const duelDoc = duelsRef.doc(duelId);
    const snapshot = await duelDoc.get();
    
    if (!snapshot.exists) {
      throw new Error('Duel not found');
    }
    
    const duel = snapshot.data();
    
    if (duel.status === DUEL_STATUS.COMPLETED) {
      return duel;
    }
    
    // Determine winner
    let winner = null;
    if (duel.challenger.score > duel.opponent.score) {
      winner = 'challenger';
    } else if (duel.opponent.score > duel.challenger.score) {
      winner = 'opponent';
    } else {
      winner = 'tie';
    }
    
    await duelDoc.update({
      status: DUEL_STATUS.COMPLETED,
      winner,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Duel completed', { 
      duelId, 
      winner,
      challengerScore: duel.challenger.score,
      opponentScore: duel.opponent.score,
    });
    
    return {
      ...duel,
      status: DUEL_STATUS.COMPLETED,
      winner,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error completing duel', { error: error.message, duelId });
    throw error;
  }
}

/**
 * Get active duels for a user
 */
async function getUserActiveDuels(userId) {
  try {
    const duelsRef = getDuelsCollection();
    
    // Query for duels where user is challenger
    const challengerQuery = await duelsRef
      .where('challenger.id', '==', userId)
      .where('status', 'in', [DUEL_STATUS.PENDING, DUEL_STATUS.ACTIVE])
      .get();
    
    // Query for duels where user is opponent
    const opponentQuery = await duelsRef
      .where('opponent.id', '==', userId)
      .where('status', 'in', [DUEL_STATUS.PENDING, DUEL_STATUS.ACTIVE])
      .get();
    
    const duels = [
      ...challengerQuery.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'challenger' })),
      ...opponentQuery.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'opponent' })),
    ];
    
    // Check for expired duels and complete them
    const now = new Date();
    for (const duel of duels) {
      if (duel.status === DUEL_STATUS.ACTIVE && duel.expiresAt && new Date(duel.expiresAt) <= now) {
        await completeDuel(duel.id);
        duel.status = DUEL_STATUS.COMPLETED;
      }
    }
    
    return duels.filter(d => d.status !== DUEL_STATUS.COMPLETED);
  } catch (error) {
    logger.error('Error getting user active duels', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get all duels for a user (including completed)
 */
async function getUserDuels(userId, limit = 20) {
  try {
    const duelsRef = getDuelsCollection();
    
    // Query for duels where user is challenger
    const challengerQuery = await duelsRef
      .where('challenger.id', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    // Query for duels where user is opponent
    const opponentQuery = await duelsRef
      .where('opponent.id', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const duels = [
      ...challengerQuery.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'challenger' })),
      ...opponentQuery.docs.map(doc => ({ id: doc.id, ...doc.data(), role: 'opponent' })),
    ];
    
    // Sort by createdAt and limit
    return duels
      .sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bDate - aDate;
      })
      .slice(0, limit);
  } catch (error) {
    logger.error('Error getting user duels', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get pending duel invitations for a user
 */
async function getPendingInvitations(userId) {
  try {
    const duelsRef = getDuelsCollection();
    const snapshot = await duelsRef
      .where('opponent.id', '==', userId)
      .where('status', '==', DUEL_STATUS.PENDING)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));
  } catch (error) {
    logger.error('Error getting pending invitations', { error: error.message, userId });
    throw error;
  }
}

/**
 * Process workout for active duels
 */
async function processWorkoutForDuels(userId, workoutData) {
  try {
    const { exercise, reps } = workoutData;
    const activeDuels = await getUserActiveDuels(userId);
    const updates = [];
    
    for (const duel of activeDuels) {
      if (duel.status !== DUEL_STATUS.ACTIVE) continue;
      
      let scoreDelta = 0;
      
      // Check if this exercise counts for the duel
      if (duel.exercise === null || duel.exercise === exercise) {
        if (duel.metric === 'total_reps') {
          scoreDelta = reps;
        } else if (duel.metric === 'workout_count') {
          scoreDelta = 1;
        }
      }
      
      if (scoreDelta > 0) {
        const result = await updateDuelScore(userId, duel.id, scoreDelta);
        updates.push(result);
      }
    }
    
    return updates;
  } catch (error) {
    logger.error('Error processing workout for duels', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get duel statistics for a user
 */
async function getDuelStats(userId) {
  try {
    const duels = await getUserDuels(userId, 100);
    const completed = duels.filter(d => d.status === DUEL_STATUS.COMPLETED);
    
    let wins = 0;
    let losses = 0;
    let ties = 0;
    
    for (const duel of completed) {
      const isChallenger = duel.challenger.id === userId;
      if (duel.winner === 'tie') {
        ties++;
      } else if ((duel.winner === 'challenger' && isChallenger) || 
                 (duel.winner === 'opponent' && !isChallenger)) {
        wins++;
      } else {
        losses++;
      }
    }
    
    return {
      total: completed.length,
      wins,
      losses,
      ties,
      winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
      active: duels.filter(d => d.status === DUEL_STATUS.ACTIVE).length,
      pending: duels.filter(d => d.status === DUEL_STATUS.PENDING).length,
    };
  } catch (error) {
    logger.error('Error getting duel stats', { error: error.message, userId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  DUEL_CHALLENGES,
  DUEL_STATUS,
  getAvailableChallenges,
  createDuel,
  acceptDuel,
  declineDuel,
  updateDuelScore,
  completeDuel,
  getUserActiveDuels,
  getUserDuels,
  getPendingInvitations,
  processWorkoutForDuels,
  getDuelStats,
};


