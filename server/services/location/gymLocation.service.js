/**
 * Gym Location Service - Manages real-world gym locations from Google Places
 * and territory control mechanics
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;

function initFirestore() {
  if (db) return db;
  if (admin.apps.length) {
    db = admin.firestore();
    return db;
  }
  throw new Error('Firestore not initialized');
}

function getGymLocationsCollection() {
  return initFirestore().collection('gymLocations');
}

function getTerritoryBattlesCollection() {
  return initFirestore().collection('territoryBattles');
}

// ============================================================================
// GYM LOCATION MANAGEMENT
// ============================================================================

/**
 * Add or update a gym location from Google Places
 */
async function upsertGymLocation(placeData) {
  try {
    const gymsRef = getGymLocationsCollection();
    const gymId = `gym_${placeData.place_id}`;
    
    const existingDoc = await gymsRef.doc(gymId).get();
    
    const gymLocation = {
      id: gymId,
      placeId: placeData.place_id,
      name: placeData.name,
      address: placeData.formatted_address || placeData.vicinity,
      location: {
        lat: placeData.geometry.location.lat,
        lng: placeData.geometry.location.lng,
      },
      rating: placeData.rating || 0,
      userRatingsTotal: placeData.user_ratings_total || 0,
      types: placeData.types || [],
      photoReference: placeData.photos?.[0]?.photo_reference || null,
      // Territory control data
      controllingClubId: existingDoc.exists ? existingDoc.data().controllingClubId : null,
      controllingClubName: existingDoc.exists ? existingDoc.data().controllingClubName : null,
      controllingClubColor: existingDoc.exists ? existingDoc.data().controllingClubColor : null,
      controlStrength: existingDoc.exists ? existingDoc.data().controlStrength : 0,
      defenders: existingDoc.exists ? existingDoc.data().defenders : [],
      lastBattleAt: existingDoc.exists ? existingDoc.data().lastBattleAt : null,
      totalBattles: existingDoc.exists ? existingDoc.data().totalBattles : 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (!existingDoc.exists) {
      gymLocation.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await gymsRef.doc(gymId).set(gymLocation, { merge: true });
    
    logger.debug('Gym location upserted', { gymId, name: gymLocation.name });
    
    return gymLocation;
  } catch (error) {
    logger.error('Error upserting gym location', { error: error.message });
    throw error;
  }
}

/**
 * Get gym locations near a coordinate
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {number} radiusKm - Search radius in kilometers (max ~161km / 100 miles)
 */
async function getNearbyGyms(lat, lng, radiusKm = 8) {
  try {
    const gymsRef = getGymLocationsCollection();
    // Firestore doesn't support geo queries natively, so we fetch all and filter
    // In production, consider using GeoFirestore or a different approach
    // Increase limit for larger radius searches
    const limit = radiusKm > 80 ? 500 : radiusKm > 40 ? 300 : 100;
    const snapshot = await gymsRef.limit(limit).get();
    
    const gyms = snapshot.docs.map(doc => {
      const data = doc.data();
      const distance = calculateDistance(lat, lng, data.location.lat, data.location.lng);
      return { ...data, distance };
    });
    
    return gyms
      .filter(gym => gym.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    logger.error('Error getting nearby gyms', { error: error.message });
    throw error;
  }
}

/**
 * Get gym by ID
 */
async function getGymById(gymId) {
  try {
    const gymsRef = getGymLocationsCollection();
    const doc = await gymsRef.doc(gymId).get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error) {
    logger.error('Error getting gym by ID', { error: error.message, gymId });
    throw error;
  }
}

// ============================================================================
// TERRITORY CONTROL
// ============================================================================

/**
 * Claim an unclaimed gym for a club
 */
async function claimGym(gymId, clubId, userId) {
  try {
    const clubService = require('./club.service');
    const userService = require('./user.service.firestore');
    
    const gym = await getGymById(gymId);
    if (!gym) throw new Error('Gym not found');
    
    if (gym.controllingClubId) {
      throw new Error('This gym is already controlled. Challenge it instead!');
    }
    
    const club = await clubService.getClubById(clubId);
    if (!club) throw new Error('Club not found');
    
    const user = await userService.findUserByUid(userId);
    if (!user || user.clubId !== clubId) {
      throw new Error('You must be a member of this club to claim territory');
    }
    
    const gymsRef = getGymLocationsCollection();
    await gymsRef.doc(gymId).update({
      controllingClubId: clubId,
      controllingClubName: club.name,
      controllingClubColor: club.color,
      controlStrength: user.level * 10,
      defenders: [{
        userId: userId,
        username: user.username,
        level: user.level,
        assignedAt: new Date().toISOString(),
      }],
      lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update club's territory count
    const clubsRef = initFirestore().collection('clubs');
    await clubsRef.doc(clubId).update({
      territoriesControlled: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Gym claimed', { gymId, clubId, userId });
    
    return { message: `${club.name} now controls ${gym.name}!`, gym: await getGymById(gymId) };
  } catch (error) {
    logger.error('Error claiming gym', { error: error.message, gymId, clubId });
    throw error;
  }
}

/**
 * Challenge a gym controlled by another club
 */
async function challengeGym(gymId, attackerClubId, attackerUserId) {
  try {
    const clubService = require('./club.service');
    const userService = require('./user.service.firestore');
    
    const gym = await getGymById(gymId);
    if (!gym) throw new Error('Gym not found');
    
    if (!gym.controllingClubId) {
      throw new Error('This gym is unclaimed. Claim it instead!');
    }
    
    if (gym.controllingClubId === attackerClubId) {
      throw new Error('Your club already controls this gym');
    }
    
    const attackerClub = await clubService.getClubById(attackerClubId);
    const defenderClub = await clubService.getClubById(gym.controllingClubId);
    const attacker = await userService.findUserByUid(attackerUserId);
    
    if (!attacker || attacker.clubId !== attackerClubId) {
      throw new Error('You must be a member of the attacking club');
    }
    
    // Calculate battle outcome
    const attackPower = attacker.level * 10 + Math.floor(Math.random() * 20);
    const defensePower = gym.controlStrength + Math.floor(Math.random() * 10);
    const attackerWins = attackPower > defensePower;
    
    // Record battle
    const battlesRef = getTerritoryBattlesCollection();
    const battleId = `battle_${Date.now()}`;
    await battlesRef.doc(battleId).set({
      id: battleId,
      gymId,
      gymName: gym.name,
      attackerClubId,
      attackerClubName: attackerClub.name,
      defenderClubId: gym.controllingClubId,
      defenderClubName: defenderClub?.name || 'Unknown',
      attackerUserId,
      attackerUsername: attacker.username,
      attackPower,
      defensePower,
      winner: attackerWins ? 'attacker' : 'defender',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    const gymsRef = getGymLocationsCollection();
    const clubsRef = initFirestore().collection('clubs');
    
    if (attackerWins) {
      // Transfer control
      await gymsRef.doc(gymId).update({
        controllingClubId: attackerClubId,
        controllingClubName: attackerClub.name,
        controllingClubColor: attackerClub.color,
        controlStrength: attacker.level * 10,
        defenders: [{
          userId: attackerUserId,
          username: attacker.username,
          level: attacker.level,
          assignedAt: new Date().toISOString(),
        }],
        lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
        totalBattles: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update club stats
      await clubsRef.doc(attackerClubId).update({
        territoriesControlled: admin.firestore.FieldValue.increment(1),
        wins: admin.firestore.FieldValue.increment(1),
      });
      
      if (gym.controllingClubId) {
        await clubsRef.doc(gym.controllingClubId).update({
          territoriesControlled: admin.firestore.FieldValue.increment(-1),
          losses: admin.firestore.FieldValue.increment(1),
        });
      }
      
      logger.info('Gym conquered', { gymId, attackerClubId, defenderClubId: gym.controllingClubId });
      
      return {
        victory: true,
        message: `Victory! ${attackerClub.name} has conquered ${gym.name}!`,
        attackPower,
        defensePower,
      };
    } else {
      // Defender holds
      await gymsRef.doc(gymId).update({
        controlStrength: Math.max(1, gym.controlStrength - Math.floor(attackPower / 2)),
        lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
        totalBattles: admin.firestore.FieldValue.increment(1),
      });
      
      logger.info('Gym defended', { gymId, attackerClubId, defenderClubId: gym.controllingClubId });
      
      return {
        victory: false,
        message: `Defeat! ${gym.name} was successfully defended.`,
        attackPower,
        defensePower,
      };
    }
  } catch (error) {
    logger.error('Error challenging gym', { error: error.message, gymId });
    throw error;
  }
}

/**
 * Add a defender to a gym
 */
async function addDefender(gymId, clubId, userId) {
  try {
    const userService = require('./user.service.firestore');
    
    const gym = await getGymById(gymId);
    if (!gym) throw new Error('Gym not found');
    
    if (gym.controllingClubId !== clubId) {
      throw new Error('Your club does not control this gym');
    }
    
    if (gym.defenders.length >= 6) {
      throw new Error('Maximum defenders reached (6)');
    }
    
    if (gym.defenders.some(d => d.userId === userId)) {
      throw new Error('You are already defending this gym');
    }
    
    const user = await userService.findUserByUid(userId);
    if (!user || user.clubId !== clubId) {
      throw new Error('You must be a club member to defend');
    }
    
    const gymsRef = getGymLocationsCollection();
    await gymsRef.doc(gymId).update({
      defenders: admin.firestore.FieldValue.arrayUnion({
        userId,
        username: user.username,
        level: user.level,
        assignedAt: new Date().toISOString(),
      }),
      controlStrength: admin.firestore.FieldValue.increment(user.level * 5),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { message: `You are now defending ${gym.name}!` };
  } catch (error) {
    logger.error('Error adding defender', { error: error.message, gymId, userId });
    throw error;
  }
}

/**
 * Get territory statistics for a club
 */
async function getClubTerritoryStats(clubId) {
  try {
    const gymsRef = getGymLocationsCollection();
    const snapshot = await gymsRef
      .where('controllingClubId', '==', clubId)
      .get();
    
    const territories = snapshot.docs.map(doc => doc.data());
    
    return {
      totalTerritories: territories.length,
      totalDefenseStrength: territories.reduce((sum, t) => sum + t.controlStrength, 0),
      territories: territories.map(t => ({
        id: t.id,
        name: t.name,
        controlStrength: t.controlStrength,
        defenderCount: t.defenders?.length || 0,
      })),
    };
  } catch (error) {
    logger.error('Error getting club territory stats', { error: error.message, clubId });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  upsertGymLocation,
  getNearbyGyms,
  getGymById,
  claimGym,
  challengeGym,
  addDefender,
  getClubTerritoryStats,
};

