/**
 * Club Service - Manages clubs (teams) that compete for gym territory control
 * Similar to Pokemon GO's team gym battles
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

// Get Firestore instance from user service
const userService = require('./user.service.firestore');

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
 * Get clubs collection reference
 */
function getClubsCollection() {
  const firestore = initFirestore();
  return firestore.collection('clubs');
}

/**
 * Get gym locations collection reference
 */
function getGymLocationsCollection() {
  const firestore = initFirestore();
  return firestore.collection('gymLocations');
}

/**
 * Get territory battles collection reference
 */
function getTerritoryBattlesCollection() {
  const firestore = initFirestore();
  return firestore.collection('territoryBattles');
}

// ============================================================================
// CLUB MANAGEMENT
// ============================================================================

/**
 * Create a new club
 */
async function createClub(founderUid, clubData) {
  try {
    const clubsRef = getClubsCollection();
    
    // Check if club name already exists
    const existingClub = await clubsRef
      .where('name', '==', clubData.name)
      .limit(1)
      .get();
    
    if (!existingClub.empty) {
      throw new Error('Club name already taken');
    }
    
    // Check if user is already in a club
    const founder = await userService.findUserByUid(founderUid);
    if (founder && founder.clubId) {
      throw new Error('You must leave your current club before creating a new one');
    }
    
    const clubId = `club_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newClub = {
      id: clubId,
      name: clubData.name,
      tag: clubData.tag?.toUpperCase().slice(0, 5) || clubData.name.slice(0, 5).toUpperCase(),
      description: clubData.description || '',
      color: clubData.color || '#FF6B6B', // Club banner color
      emblem: clubData.emblem || 'shield', // Club emblem icon
      founderId: founderUid,
      founderName: founder?.username || 'Unknown',
      members: [founderUid],
      officers: [], // Users with elevated permissions
      memberCount: 1,
      totalPower: founder?.level || 1,
      territoriesControlled: 0,
      weeklyXP: 0,
      totalXP: 0,
      wins: 0,
      losses: 0,
      isRecruiting: true,
      minLevelToJoin: clubData.minLevelToJoin || 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await clubsRef.doc(clubId).set(newClub);
    
    // Update founder's club reference
    await userService.updateUser(founderUid, { clubId, clubRole: 'founder' });
    
    logger.info('Club created successfully', { clubId, name: newClub.name, founderId: founderUid });
    
    return {
      ...newClub,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error creating club', { error: error.message, founderUid });
    throw error;
  }
}

/**
 * Get club by ID
 */
async function getClubById(clubId) {
  try {
    const clubsRef = getClubsCollection();
    const doc = await clubsRef.doc(clubId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    logger.error('Error getting club by ID', { error: error.message, clubId });
    throw error;
  }
}

/**
 * Get all clubs with optional filters
 */
async function getClubs(options = {}) {
  try {
    const clubsRef = getClubsCollection();
    let query = clubsRef;
    
    if (options.isRecruiting) {
      query = query.where('isRecruiting', '==', true);
    }
    
    if (options.minLevel) {
      query = query.where('minLevelToJoin', '<=', options.minLevel);
    }
    
    // Order by territories controlled or total power
    query = query.orderBy('territoriesControlled', 'desc').limit(options.limit || 50);
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
  } catch (error) {
    logger.error('Error getting clubs', { error: error.message });
    throw error;
  }
}

/**
 * Join a club
 */
async function joinClub(userId, clubId) {
  try {
    const clubsRef = getClubsCollection();
    const clubDoc = await clubsRef.doc(clubId).get();
    
    if (!clubDoc.exists) {
      throw new Error('Club not found');
    }
    
    const club = clubDoc.data();
    
    // Check if user is already in a club
    const user = await userService.findUserByUid(userId);
    if (user && user.clubId) {
      throw new Error('You must leave your current club first');
    }
    
    // Check if club is recruiting
    if (!club.isRecruiting) {
      throw new Error('This club is not accepting new members');
    }
    
    // Check level requirement
    if (user && user.level < club.minLevelToJoin) {
      throw new Error(`You must be at least level ${club.minLevelToJoin} to join this club`);
    }
    
    // Add user to club
    await clubsRef.doc(clubId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
      memberCount: admin.firestore.FieldValue.increment(1),
      totalPower: admin.firestore.FieldValue.increment(user?.level || 1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update user's club reference
    await userService.updateUser(userId, { clubId, clubRole: 'member' });
    
    logger.info('User joined club', { userId, clubId, clubName: club.name });
    
    return { message: `Welcome to ${club.name}!`, clubId };
  } catch (error) {
    logger.error('Error joining club', { error: error.message, userId, clubId });
    throw error;
  }
}

/**
 * Leave a club
 */
async function leaveClub(userId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.clubId) {
      throw new Error('You are not in a club');
    }
    
    const clubId = user.clubId;
    const clubsRef = getClubsCollection();
    const clubDoc = await clubsRef.doc(clubId).get();
    
    if (!clubDoc.exists) {
      // Club doesn't exist, just clear user's club reference
      await userService.updateUser(userId, { clubId: null, clubRole: null });
      return { message: 'Left club successfully' };
    }
    
    const club = clubDoc.data();
    
    // Check if user is founder
    if (club.founderId === userId) {
      // Transfer ownership or disband if no other members
      if (club.memberCount <= 1) {
        // Disband the club
        await clubsRef.doc(clubId).delete();
        logger.info('Club disbanded', { clubId, clubName: club.name });
      } else {
        // Transfer to first officer or first member
        const newFounder = club.officers[0] || club.members.find(m => m !== userId);
        await clubsRef.doc(clubId).update({
          founderId: newFounder,
          members: admin.firestore.FieldValue.arrayRemove(userId),
          memberCount: admin.firestore.FieldValue.increment(-1),
          totalPower: admin.firestore.FieldValue.increment(-(user.level || 1)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Regular member leaving
      await clubsRef.doc(clubId).update({
        members: admin.firestore.FieldValue.arrayRemove(userId),
        officers: admin.firestore.FieldValue.arrayRemove(userId),
        memberCount: admin.firestore.FieldValue.increment(-1),
        totalPower: admin.firestore.FieldValue.increment(-(user.level || 1)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Clear user's club reference
    await userService.updateUser(userId, { clubId: null, clubRole: null });
    
    logger.info('User left club', { userId, clubId, clubName: club.name });
    
    return { message: `You have left ${club.name}` };
  } catch (error) {
    logger.error('Error leaving club', { error: error.message, userId });
    throw error;
  }
}

/**
 * Update club settings (founder/officer only)
 */
async function updateClub(userId, clubId, updates) {
  try {
    const user = await userService.findUserByUid(userId);
    const club = await getClubById(clubId);
    
    if (!club) {
      throw new Error('Club not found');
    }
    
    // Check permissions
    const isFounder = club.founderId === userId;
    const isOfficer = club.officers.includes(userId);
    
    if (!isFounder && !isOfficer) {
      throw new Error('You do not have permission to update this club');
    }
    
    // Officers can only update certain fields
    const allowedFields = isFounder 
      ? ['name', 'tag', 'description', 'color', 'emblem', 'isRecruiting', 'minLevelToJoin']
      : ['description', 'isRecruiting'];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    const clubsRef = getClubsCollection();
    await clubsRef.doc(clubId).update(filteredUpdates);
    
    logger.info('Club updated', { clubId, updates: Object.keys(filteredUpdates), by: userId });
    
    return await getClubById(clubId);
  } catch (error) {
    logger.error('Error updating club', { error: error.message, userId, clubId });
    throw error;
  }
}

/**
 * Get club members with details
 */
async function getClubMembers(clubId) {
  try {
    const club = await getClubById(clubId);
    if (!club) {
      throw new Error('Club not found');
    }
    
    const members = await Promise.all(
      club.members.map(async (memberId) => {
        const user = await userService.findUserByUid(memberId);
        if (!user) return null;
        
        return {
          id: user.id,
          username: user.username,
          handle: user.handle,
          level: user.level,
          avatarUrl: user.avatarUrl,
          role: user.id === club.founderId ? 'founder' : 
                club.officers.includes(user.id) ? 'officer' : 'member',
          weeklyXP: user.weeklyXP || 0,
        };
      })
    );
    
    return members.filter(m => m !== null).sort((a, b) => {
      // Sort by role, then by level
      const roleOrder = { founder: 0, officer: 1, member: 2 };
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return b.level - a.level;
    });
  } catch (error) {
    logger.error('Error getting club members', { error: error.message, clubId });
    throw error;
  }
}

/**
 * Get club leaderboard
 */
async function getClubLeaderboard(limit = 20) {
  try {
    const clubsRef = getClubsCollection();
    const snapshot = await clubsRef
      .orderBy('territoriesControlled', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        id: data.id,
        name: data.name,
        tag: data.tag,
        color: data.color,
        memberCount: data.memberCount,
        territoriesControlled: data.territoriesControlled,
        totalPower: data.totalPower,
        wins: data.wins,
        losses: data.losses,
      };
    });
  } catch (error) {
    logger.error('Error getting club leaderboard', { error: error.message });
    throw error;
  }
}

// ============================================================================
// GYM TERRITORY MANAGEMENT
// ============================================================================

/**
 * Get all gym territories (for the gyms list)
 */
async function getGymTerritories(options = {}) {
  try {
    const gymLocationsRef = getGymLocationsCollection();
    let query = gymLocationsRef;
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        location: data.location,
        rating: data.rating,
        controllingClubId: data.controllingClubId || null,
        controllingClubName: data.controllingClubName || null,
        controllingClubColor: data.controllingClubColor || null,
        controlStrength: data.controlStrength || 0,
        defenders: data.defenders || [],
        totalBattles: data.totalBattles || 0,
      };
    });
  } catch (error) {
    logger.error('Error getting gym territories', { error: error.message });
    // Return empty array instead of throwing to not break the gyms endpoint
    return [];
  }
}

/**
 * Claim an unclaimed gym territory
 */
async function claimGymTerritory(userId, gymId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.clubId) {
      throw new Error('You must be in a club to claim territory');
    }
    
    const club = await getClubById(user.clubId);
    if (!club) {
      throw new Error('Club not found');
    }
    
    const gymLocationsRef = getGymLocationsCollection();
    const gymDoc = await gymLocationsRef.doc(gymId).get();
    
    if (!gymDoc.exists) {
      throw new Error('Gym territory not found');
    }
    
    const gym = gymDoc.data();
    
    if (gym.controllingClubId) {
      throw new Error('This territory is already claimed');
    }
    
    // Claim the territory
    await gymLocationsRef.doc(gymId).update({
      controllingClubId: club.id,
      controllingClubName: club.name,
      controllingClubColor: club.color,
      controlStrength: user.level || 1,
      defenders: [{
        userId: user.uid,
        username: user.username,
        level: user.level || 1,
      }],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update club territories count
    const clubsRef = getClubsCollection();
    await clubsRef.doc(club.id).update({
      territoriesControlled: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Territory claimed', { gymId, clubId: club.id, userId });
    
    return { message: `Successfully claimed ${gym.name} for ${club.name}!` };
  } catch (error) {
    logger.error('Error claiming territory', { error: error.message, userId, gymId });
    throw error;
  }
}

/**
 * Challenge a club-controlled gym
 */
async function challengeGymTerritory(userId, gymId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.clubId) {
      throw new Error('You must be in a club to challenge territory');
    }
    
    const attackerClub = await getClubById(user.clubId);
    if (!attackerClub) {
      throw new Error('Club not found');
    }
    
    const gymLocationsRef = getGymLocationsCollection();
    const gymDoc = await gymLocationsRef.doc(gymId).get();
    
    if (!gymDoc.exists) {
      throw new Error('Gym territory not found');
    }
    
    const gym = gymDoc.data();
    
    if (!gym.controllingClubId) {
      throw new Error('This territory is unclaimed - use claim instead');
    }
    
    if (gym.controllingClubId === user.clubId) {
      throw new Error('Your club already controls this territory');
    }
    
    // Calculate battle (simplified - could be more complex)
    const attackerPower = user.level || 1;
    const defenderStrength = gym.controlStrength || 1;
    
    // Attacker needs to beat defender strength
    const attackRoll = attackerPower + Math.floor(Math.random() * 10);
    const defenseRoll = defenderStrength + Math.floor(Math.random() * 5);
    
    const victory = attackRoll > defenseRoll;
    
    // Record battle
    const battleRecord = {
      gymId,
      attackerClubId: attackerClub.id,
      attackerUserId: userId,
      defenderClubId: gym.controllingClubId,
      attackerPower,
      defenderStrength,
      victory,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const battlesRef = getTerritoryBattlesCollection();
    await battlesRef.add(battleRecord);
    
    // Update gym
    await gymLocationsRef.doc(gymId).update({
      totalBattles: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    const clubsRef = getClubsCollection();
    
    if (victory) {
      // Transfer territory to attacker
      await gymLocationsRef.doc(gymId).update({
        controllingClubId: attackerClub.id,
        controllingClubName: attackerClub.name,
        controllingClubColor: attackerClub.color,
        controlStrength: attackerPower,
        defenders: [{
          userId: user.uid,
          username: user.username,
          level: user.level || 1,
        }],
      });
      
      // Update club stats
      await clubsRef.doc(attackerClub.id).update({
        territoriesControlled: admin.firestore.FieldValue.increment(1),
        wins: admin.firestore.FieldValue.increment(1),
      });
      
      await clubsRef.doc(gym.controllingClubId).update({
        territoriesControlled: admin.firestore.FieldValue.increment(-1),
        losses: admin.firestore.FieldValue.increment(1),
      });
      
      logger.info('Territory captured', { gymId, attackerClubId: attackerClub.id, defenderClubId: gym.controllingClubId });
      
      return { 
        message: `Victory! You captured ${gym.name} for ${attackerClub.name}!`,
        victory: true,
      };
    } else {
      // Defense holds
      await clubsRef.doc(attackerClub.id).update({
        losses: admin.firestore.FieldValue.increment(1),
      });
      
      await clubsRef.doc(gym.controllingClubId).update({
        wins: admin.firestore.FieldValue.increment(1),
      });
      
      logger.info('Territory defense successful', { gymId, attackerClubId: attackerClub.id, defenderClubId: gym.controllingClubId });
      
      return {
        message: `Defeat! ${gym.controllingClubName} successfully defended ${gym.name}!`,
        victory: false,
      };
    }
  } catch (error) {
    logger.error('Error challenging territory', { error: error.message, userId, gymId });
    throw error;
  }
}

/**
 * Add a defender to a gym your club controls
 */
async function addGymDefender(userId, gymId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.clubId) {
      throw new Error('You must be in a club');
    }
    
    const gymLocationsRef = getGymLocationsCollection();
    const gymDoc = await gymLocationsRef.doc(gymId).get();
    
    if (!gymDoc.exists) {
      throw new Error('Gym territory not found');
    }
    
    const gym = gymDoc.data();
    
    if (gym.controllingClubId !== user.clubId) {
      throw new Error('Your club does not control this territory');
    }
    
    // Check if already defending
    const alreadyDefending = (gym.defenders || []).some(d => d.userId === userId);
    if (alreadyDefending) {
      throw new Error('You are already defending this territory');
    }
    
    // Max 5 defenders
    if ((gym.defenders || []).length >= 5) {
      throw new Error('Maximum defenders reached for this territory');
    }
    
    const newDefenders = [...(gym.defenders || []), {
      userId: user.uid,
      username: user.username,
      level: user.level || 1,
    }];
    
    const newStrength = newDefenders.reduce((sum, d) => sum + d.level, 0);
    
    await gymLocationsRef.doc(gymId).update({
      defenders: newDefenders,
      controlStrength: newStrength,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Defender added', { gymId, userId, newStrength });
    
    return { message: `You are now defending ${gym.name}! Territory strength: ${newStrength}` };
  } catch (error) {
    logger.error('Error adding defender', { error: error.message, userId, gymId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createClub,
  getClubById,
  getClubs,
  joinClub,
  leaveClub,
  updateClub,
  getClubMembers,
  getClubLeaderboard,
  getGymTerritories,
  claimGymTerritory,
  challengeGymTerritory,
  addGymDefender,
};

