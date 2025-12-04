/**
 * Raid Service - Manages party raid bosses and battles
 * Supports real-time HP tracking and member contributions
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');
const partyService = require('./party.service');

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
 * Get raids collection reference
 */
function getRaidsCollection() {
  const firestore = initFirestore();
  return firestore.collection('raids');
}

/**
 * Get raid bosses collection reference
 */
function getRaidBossesCollection() {
  const firestore = initFirestore();
  return firestore.collection('raidBosses');
}

// ============================================================================
// BOSS DEFINITIONS - Can be moved to Firestore later
// ============================================================================

const RAID_BOSSES = [
  {
    id: 'iron_golem',
    name: 'Iron Golem',
    flavorText: 'A hulking construct of twisted metal and pure determination. Only the strongest parties can topple this mechanical menace.',
    baseHp: 1000,
    hpPerMember: 500,
    minMembers: 1,
    maxMembers: 8,
    difficulty: 'normal',
    imageUrl: '/assets/bosses/iron_golem.png',
    rewards: {
      xpPerMember: 100,
      bonusXpForTopContributor: 50,
    },
    color: '#6B7280',
  },
  {
    id: 'flame_titan',
    name: 'Flame Titan',
    flavorText: 'Born from the eternal flames of Mount Forge, this titan burns with an intensity that matches your workout fire.',
    baseHp: 2000,
    hpPerMember: 800,
    minMembers: 2,
    maxMembers: 8,
    difficulty: 'hard',
    imageUrl: '/assets/bosses/flame_titan.png',
    rewards: {
      xpPerMember: 200,
      bonusXpForTopContributor: 100,
    },
    color: '#EF4444',
  },
  {
    id: 'shadow_dragon',
    name: 'Shadow Dragon',
    flavorText: 'An ancient beast that feeds on laziness and excuses. Defeat it to prove your dedication to the forge.',
    baseHp: 5000,
    hpPerMember: 1500,
    minMembers: 3,
    maxMembers: 8,
    difficulty: 'legendary',
    imageUrl: '/assets/bosses/shadow_dragon.png',
    rewards: {
      xpPerMember: 500,
      bonusXpForTopContributor: 250,
    },
    color: '#8B5CF6',
  },
  {
    id: 'crystal_hydra',
    name: 'Crystal Hydra',
    flavorText: 'Each head represents a different muscle group. Cut one down and two more seem to appear!',
    baseHp: 3000,
    hpPerMember: 1000,
    minMembers: 2,
    maxMembers: 8,
    difficulty: 'hard',
    imageUrl: '/assets/bosses/crystal_hydra.png',
    rewards: {
      xpPerMember: 300,
      bonusXpForTopContributor: 150,
    },
    color: '#06B6D4',
  },
  {
    id: 'thunder_colossus',
    name: 'Thunder Colossus',
    flavorText: 'A storm giant whose every step shakes the arena. Match its power with your reps!',
    baseHp: 4000,
    hpPerMember: 1200,
    minMembers: 3,
    maxMembers: 8,
    difficulty: 'legendary',
    imageUrl: '/assets/bosses/thunder_colossus.png',
    rewards: {
      xpPerMember: 400,
      bonusXpForTopContributor: 200,
    },
    color: '#F59E0B',
  },
];

// ============================================================================
// BOSS MANAGEMENT
// ============================================================================

/**
 * Get all available raid bosses with scaled HP preview
 */
function getAvailableBosses(memberCount = 1) {
  return RAID_BOSSES.map(boss => ({
    ...boss,
    scaledHp: calculateScaledHp(boss, memberCount),
    isAvailable: memberCount >= boss.minMembers && memberCount <= boss.maxMembers,
  }));
}

/**
 * Get a specific boss by ID
 */
function getBossById(bossId) {
  return RAID_BOSSES.find(boss => boss.id === bossId) || null;
}

/**
 * Calculate scaled HP based on party size
 */
function calculateScaledHp(boss, memberCount) {
  return boss.baseHp + (boss.hpPerMember * memberCount);
}

// ============================================================================
// RAID MANAGEMENT
// ============================================================================

/**
 * Get active raid for a party
 */
async function getActiveRaid(partyId) {
  try {
    const raidsRef = getRaidsCollection();
    const snapshot = await raidsRef
      .where('partyId', '==', partyId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    logger.error('Error getting active raid', { error: error.message, partyId });
    throw error;
  }
}

/**
 * Get raid by ID
 */
async function getRaidById(raidId) {
  try {
    const raidsRef = getRaidsCollection();
    const doc = await raidsRef.doc(raidId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
    };
  } catch (error) {
    logger.error('Error getting raid by ID', { error: error.message, raidId });
    throw error;
  }
}

/**
 * Start a new raid (owner only)
 */
async function startRaid(userId, partyId, bossId) {
  try {
    // Get party and verify ownership
    const party = await partyService.getPartyById(partyId);
    
    if (!party) {
      throw new Error('Party not found');
    }
    
    if (party.ownerId !== userId) {
      throw new Error('Only the party owner can start a raid');
    }
    
    // Check for active raid
    const activeRaid = await getActiveRaid(partyId);
    if (activeRaid) {
      throw new Error('Party already has an active raid');
    }
    
    // Get boss
    const boss = getBossById(bossId);
    if (!boss) {
      throw new Error('Boss not found');
    }
    
    // Check member requirements
    const memberCount = party.memberCount;
    if (memberCount < boss.minMembers) {
      throw new Error(`Need at least ${boss.minMembers} members to fight ${boss.name}`);
    }
    
    if (memberCount > boss.maxMembers) {
      throw new Error(`Maximum ${boss.maxMembers} members allowed for ${boss.name}`);
    }
    
    // Calculate scaled HP
    const hpTotal = calculateScaledHp(boss, memberCount);
    
    // Create raid record
    const raidId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize contributions for all members
    const contributions = {};
    party.members.forEach(member => {
      contributions[member.userId] = {
        oderId: member.userId,
        odername: member.username,
        oderAvatarUrl: member.avatarUrl,
        oderLevel: member.level,
        odalDamage: 0,
        odalHits: 0,
      };
    });
    
    // Fix the contribution object keys (typo above)
    const fixedContributions = {};
    party.members.forEach(member => {
      fixedContributions[member.userId] = {
        userId: member.userId,
        username: member.username,
        avatarUrl: member.avatarUrl,
        level: member.level,
        totalDamage: 0,
        totalHits: 0,
      };
    });
    
    const newRaid = {
      id: raidId,
      partyId,
      partyName: party.name,
      bossId: boss.id,
      bossName: boss.name,
      bossFlavorText: boss.flavorText,
      bossColor: boss.color,
      bossDifficulty: boss.difficulty,
      hpTotal,
      hpRemaining: hpTotal,
      memberCount,
      contributions: fixedContributions,
      rewards: boss.rewards,
      status: 'active',
      startedBy: userId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      damageLog: [], // Recent damage events for batching display
    };
    
    const raidsRef = getRaidsCollection();
    await raidsRef.doc(raidId).set(newRaid);
    
    logger.info('Raid started', { raidId, partyId, bossId, bossName: boss.name, hpTotal });
    
    return {
      ...newRaid,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error starting raid', { error: error.message, userId, partyId, bossId });
    throw error;
  }
}

/**
 * Log damage to the raid boss
 * Damage is calculated based on workout activity
 */
async function logDamage(userId, raidId, damage, source = 'workout') {
  try {
    const raid = await getRaidById(raidId);
    
    if (!raid) {
      throw new Error('Raid not found');
    }
    
    if (raid.status !== 'active') {
      throw new Error('Raid is not active');
    }
    
    // Verify user is a participant
    if (!raid.contributions[userId]) {
      throw new Error('You are not a participant in this raid');
    }
    
    // Calculate new HP
    const newHpRemaining = Math.max(0, raid.hpRemaining - damage);
    const isDefeated = newHpRemaining === 0;
    
    // Update contribution
    const updatedContributions = { ...raid.contributions };
    updatedContributions[userId] = {
      ...updatedContributions[userId],
      totalDamage: (updatedContributions[userId].totalDamage || 0) + damage,
      totalHits: (updatedContributions[userId].totalHits || 0) + 1,
    };
    
    // Create damage log entry (keep last 20 for display)
    const damageEntry = {
      userId,
      username: updatedContributions[userId].username,
      damage,
      source,
      timestamp: new Date().toISOString(),
    };
    
    const updatedDamageLog = [...(raid.damageLog || []), damageEntry].slice(-20);
    
    // Prepare update
    const updateData = {
      hpRemaining: newHpRemaining,
      contributions: updatedContributions,
      damageLog: updatedDamageLog,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (isDefeated) {
      updateData.status = 'completed';
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.victory = true;
    }
    
    const raidsRef = getRaidsCollection();
    await raidsRef.doc(raidId).update(updateData);
    
    logger.info('Damage logged', { 
      raidId, 
      oderId: userId, 
      damage, 
      newHpRemaining, 
      isDefeated 
    });
    
    // Get updated raid data
    const updatedRaid = await getRaidById(raidId);
    
    return {
      raid: updatedRaid,
      damageDealt: damage,
      isDefeated,
      newHpRemaining,
    };
  } catch (error) {
    logger.error('Error logging damage', { error: error.message, userId, raidId, damage });
    throw error;
  }
}

/**
 * Get contribution leaderboard for a raid
 */
async function getContributionLeaderboard(raidId) {
  try {
    const raid = await getRaidById(raidId);
    
    if (!raid) {
      throw new Error('Raid not found');
    }
    
    // Convert contributions object to sorted array
    const leaderboard = Object.values(raid.contributions)
      .sort((a, b) => b.totalDamage - a.totalDamage)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        damagePercentage: raid.hpTotal > 0 
          ? ((entry.totalDamage / raid.hpTotal) * 100).toFixed(1)
          : '0.0',
      }));
    
    return leaderboard;
  } catch (error) {
    logger.error('Error getting contribution leaderboard', { error: error.message, raidId });
    throw error;
  }
}

/**
 * Abandon a raid (owner only)
 */
async function abandonRaid(userId, raidId) {
  try {
    const raid = await getRaidById(raidId);
    
    if (!raid) {
      throw new Error('Raid not found');
    }
    
    // Get party to verify ownership
    const party = await partyService.getPartyById(raid.partyId);
    
    if (!party || party.ownerId !== userId) {
      throw new Error('Only the party owner can abandon the raid');
    }
    
    if (raid.status !== 'active') {
      throw new Error('Raid is not active');
    }
    
    const raidsRef = getRaidsCollection();
    await raidsRef.doc(raidId).update({
      status: 'abandoned',
      victory: false,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Raid abandoned', { raidId, oderId: userId });
    
    return { message: 'Raid abandoned' };
  } catch (error) {
    logger.error('Error abandoning raid', { error: error.message, userId, raidId });
    throw error;
  }
}

/**
 * Get raid history for a party
 */
async function getRaidHistory(partyId, limit = 10) {
  try {
    const raidsRef = getRaidsCollection();
    const snapshot = await raidsRef
      .where('partyId', '==', partyId)
      .where('status', 'in', ['completed', 'abandoned'])
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || data.startedAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      };
    });
  } catch (error) {
    logger.error('Error getting raid history', { error: error.message, partyId });
    throw error;
  }
}

/**
 * Calculate damage from workout
 * This can be enhanced with more complex formulas
 */
function calculateWorkoutDamage(exercise, reps, userLevel = 1) {
  const baseDamage = {
    squat: 2,
    pushup: 1.5,
    pullup: 2.5,
    run: 1, // per minute
    plank: 0.5, // per second
    burpee: 3,
    lunge: 1.5,
    default: 1,
  };
  
  const exerciseDamage = baseDamage[exercise.toLowerCase()] || baseDamage.default;
  const levelMultiplier = 1 + (userLevel * 0.1); // 10% bonus per level
  
  return Math.floor(exerciseDamage * reps * levelMultiplier);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getAvailableBosses,
  getBossById,
  calculateScaledHp,
  getActiveRaid,
  getRaidById,
  startRaid,
  logDamage,
  getContributionLeaderboard,
  abandonRaid,
  getRaidHistory,
  calculateWorkoutDamage,
};

