/**
 * Party Service - Manages workout parties for group activities
 * Users can create parties, invite others via code, and work out together
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');
const crypto = require('crypto');

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
 * Get parties collection reference
 */
function getPartiesCollection() {
  const firestore = initFirestore();
  return firestore.collection('parties');
}

/**
 * Generate a short, unique invite code
 * Format: 6 alphanumeric characters (uppercase)
 */
function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ============================================================================
// PARTY MANAGEMENT
// ============================================================================

/**
 * Create a new party
 * @param {string} ownerUid - User ID of party creator
 * @param {object} partyData - Party details { name }
 */
async function createParty(ownerUid, partyData) {
  try {
    const partiesRef = getPartiesCollection();
    
    // Check if user is already in a party
    const existingParty = await getUserParty(ownerUid);
    if (existingParty) {
      throw new Error('You must leave your current party before creating a new one');
    }
    
    // Get user details
    const owner = await userService.findUserByUid(ownerUid);
    if (!owner) {
      throw new Error('User not found');
    }
    
    // Validate party name
    if (!partyData.name || partyData.name.trim().length < 2) {
      throw new Error('Party name must be at least 2 characters');
    }
    
    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existing = await partiesRef.where('inviteCode', '==', inviteCode).limit(1).get();
      isUnique = existing.empty;
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique invite code. Please try again.');
    }
    
    const partyId = `party_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const newParty = {
      id: partyId,
      name: partyData.name.trim(),
      inviteCode,
      ownerId: ownerUid,
      ownerUsername: owner.username,
      ownerAvatarUrl: owner.avatarUrl || null,
      members: [{
        oderId: owner.uid,
        odername: owner.username,
        oderHandle: owner.handle,
        oderAvatarUrl: owner.avatarUrl || null,
        oderLevel: owner.level || 1,
        oderRole: 'owner',
        oderedAt: admin.firestore.FieldValue.serverTimestamp(),
      }],
      memberCount: 1,
      maxMembers: 8, // Maximum party size
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Fix the member object keys (typo above - should be userId, etc.)
    newParty.members = [{
      userId: ownerUid,
      username: owner.username,
      handle: owner.handle,
      avatarUrl: owner.avatarUrl || null,
      level: owner.level || 1,
      role: 'owner',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    }];
    
    await partiesRef.doc(partyId).set(newParty);
    
    // Update user's party reference
    await userService.updateUser(ownerUid, { partyId, partyRole: 'owner' });
    
    logger.info('Party created successfully', { partyId, name: newParty.name, ownerId: ownerUid });
    
    return {
      ...newParty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [{
        userId: ownerUid,
        username: owner.username,
        handle: owner.handle,
        avatarUrl: owner.avatarUrl || null,
        level: owner.level || 1,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      }],
    };
  } catch (error) {
    logger.error('Error creating party', { error: error.message, ownerUid });
    throw error;
  }
}

/**
 * Get party by ID
 */
async function getPartyById(partyId) {
  try {
    const partiesRef = getPartiesCollection();
    const doc = await partiesRef.doc(partyId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      members: data.members?.map(m => ({
        ...m,
        joinedAt: m.joinedAt?.toDate?.()?.toISOString() || m.joinedAt,
      })) || [],
    };
  } catch (error) {
    logger.error('Error getting party by ID', { error: error.message, partyId });
    throw error;
  }
}

/**
 * Get party by invite code
 */
async function getPartyByInviteCode(inviteCode) {
  try {
    const partiesRef = getPartiesCollection();
    const snapshot = await partiesRef
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      members: data.members?.map(m => ({
        ...m,
        joinedAt: m.joinedAt?.toDate?.()?.toISOString() || m.joinedAt,
      })) || [],
    };
  } catch (error) {
    logger.error('Error getting party by invite code', { error: error.message, inviteCode });
    throw error;
  }
}

/**
 * Get user's current party
 */
async function getUserParty(userId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.partyId) {
      return null;
    }
    
    return await getPartyById(user.partyId);
  } catch (error) {
    logger.error('Error getting user party', { error: error.message, userId });
    throw error;
  }
}

/**
 * Join a party via invite code
 */
async function joinParty(userId, inviteCode) {
  try {
    // Check if user is already in a party
    const existingParty = await getUserParty(userId);
    if (existingParty) {
      throw new Error('You must leave your current party first');
    }
    
    // Find party by invite code
    const party = await getPartyByInviteCode(inviteCode);
    if (!party) {
      throw new Error('Invalid invite code. Party not found.');
    }
    
    // Check if party is full
    if (party.memberCount >= party.maxMembers) {
      throw new Error('Party is full');
    }
    
    // Check if user is already a member
    if (party.members.some(m => m.userId === userId)) {
      throw new Error('You are already a member of this party');
    }
    
    // Get user details
    const user = await userService.findUserByUid(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add user to party
    const partiesRef = getPartiesCollection();
    const newMember = {
      userId,
      username: user.username,
      handle: user.handle,
      avatarUrl: user.avatarUrl || null,
      level: user.level || 1,
      role: 'member',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await partiesRef.doc(party.id).update({
      members: admin.firestore.FieldValue.arrayUnion(newMember),
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update user's party reference
    await userService.updateUser(userId, { partyId: party.id, partyRole: 'member' });
    
    logger.info('User joined party', { userId, partyId: party.id, partyName: party.name });
    
    return {
      message: `Welcome to ${party.name}!`,
      party: await getPartyById(party.id),
    };
  } catch (error) {
    logger.error('Error joining party', { error: error.message, userId, inviteCode });
    throw error;
  }
}

/**
 * Leave a party
 * If owner leaves, ownership is transferred to the next member
 * If no members remain, the party is disbanded
 */
async function leaveParty(userId) {
  try {
    const user = await userService.findUserByUid(userId);
    
    if (!user || !user.partyId) {
      throw new Error('You are not in a party');
    }
    
    const partyId = user.partyId;
    const party = await getPartyById(partyId);
    
    if (!party) {
      // Party doesn't exist, just clear user's reference
      await userService.updateUser(userId, { partyId: null, partyRole: null });
      return { message: 'Left party successfully' };
    }
    
    const partiesRef = getPartiesCollection();
    const isOwner = party.ownerId === userId;
    
    // Find the member to remove
    const memberToRemove = party.members.find(m => m.userId === userId);
    
    if (party.memberCount <= 1) {
      // Last member leaving - disband the party
      await partiesRef.doc(partyId).update({
        isActive: false,
        disbandedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      logger.info('Party disbanded', { partyId, partyName: party.name });
    } else if (isOwner) {
      // Owner leaving - transfer ownership
      const remainingMembers = party.members.filter(m => m.userId !== userId);
      const newOwner = remainingMembers[0]; // First remaining member becomes owner
      
      // Update new owner's role in the members array
      const updatedMembers = remainingMembers.map(m => 
        m.userId === newOwner.userId ? { ...m, role: 'owner' } : m
      );
      
      await partiesRef.doc(partyId).update({
        ownerId: newOwner.userId,
        ownerUsername: newOwner.username,
        ownerAvatarUrl: newOwner.avatarUrl,
        members: updatedMembers,
        memberCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update new owner's role in their user profile
      await userService.updateUser(newOwner.userId, { partyRole: 'owner' });
      
      logger.info('Party ownership transferred', { 
        partyId, 
        oldOwner: userId, 
        newOwner: newOwner.userId 
      });
    } else {
      // Regular member leaving
      const updatedMembers = party.members.filter(m => m.userId !== userId);
      
      await partiesRef.doc(partyId).update({
        members: updatedMembers,
        memberCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    // Clear user's party reference
    await userService.updateUser(userId, { partyId: null, partyRole: null });
    
    logger.info('User left party', { userId, partyId, partyName: party.name });
    
    return { 
      message: `You have left ${party.name}`,
      wasOwner: isOwner,
      partyDisbanded: party.memberCount <= 1,
    };
  } catch (error) {
    logger.error('Error leaving party', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get party members with full details
 */
async function getPartyMembers(partyId) {
  try {
    const party = await getPartyById(partyId);
    if (!party) {
      throw new Error('Party not found');
    }
    
    // Get fresh user data for each member
    const members = await Promise.all(
      party.members.map(async (member) => {
        const user = await userService.findUserByUid(member.userId);
        if (!user) {
          return {
            ...member,
            isOnline: false,
          };
        }
        
        return {
          userId: user.uid,
          username: user.username,
          handle: user.handle,
          avatarUrl: user.avatarUrl || null,
          level: user.level || 1,
          role: member.role,
          joinedAt: member.joinedAt,
          xp: user.xp || 0,
          workoutStreak: user.workoutStreak || 0,
          isOnline: true, // Could be enhanced with real presence detection
        };
      })
    );
    
    // Sort by role (owner first) then by level
    return members.sort((a, b) => {
      const roleOrder = { owner: 0, member: 1 };
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return b.level - a.level;
    });
  } catch (error) {
    logger.error('Error getting party members', { error: error.message, partyId });
    throw error;
  }
}

/**
 * Update party settings (owner only)
 */
async function updateParty(userId, partyId, updates) {
  try {
    const party = await getPartyById(partyId);
    
    if (!party) {
      throw new Error('Party not found');
    }
    
    // Check if user is the owner
    if (party.ownerId !== userId) {
      throw new Error('Only the party owner can update settings');
    }
    
    // Only allow certain fields to be updated
    const allowedFields = ['name'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    if (filteredUpdates.name) {
      if (filteredUpdates.name.trim().length < 2) {
        throw new Error('Party name must be at least 2 characters');
      }
      filteredUpdates.name = filteredUpdates.name.trim();
    }
    
    filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    const partiesRef = getPartiesCollection();
    await partiesRef.doc(partyId).update(filteredUpdates);
    
    logger.info('Party updated', { partyId, updates: Object.keys(filteredUpdates), by: userId });
    
    return await getPartyById(partyId);
  } catch (error) {
    logger.error('Error updating party', { error: error.message, userId, partyId });
    throw error;
  }
}

/**
 * Regenerate invite code (owner only)
 */
async function regenerateInviteCode(userId, partyId) {
  try {
    const party = await getPartyById(partyId);
    
    if (!party) {
      throw new Error('Party not found');
    }
    
    if (party.ownerId !== userId) {
      throw new Error('Only the party owner can regenerate the invite code');
    }
    
    const partiesRef = getPartiesCollection();
    
    // Generate new unique invite code
    let newInviteCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      newInviteCode = generateInviteCode();
      const existing = await partiesRef.where('inviteCode', '==', newInviteCode).limit(1).get();
      isUnique = existing.empty;
      attempts++;
    }
    
    if (!isUnique) {
      throw new Error('Failed to generate unique invite code. Please try again.');
    }
    
    await partiesRef.doc(partyId).update({
      inviteCode: newInviteCode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Invite code regenerated', { partyId, by: userId });
    
    return { inviteCode: newInviteCode };
  } catch (error) {
    logger.error('Error regenerating invite code', { error: error.message, userId, partyId });
    throw error;
  }
}

/**
 * Kick a member from party (owner only)
 */
async function kickMember(ownerId, partyId, memberToKickId) {
  try {
    const party = await getPartyById(partyId);
    
    if (!party) {
      throw new Error('Party not found');
    }
    
    if (party.ownerId !== ownerId) {
      throw new Error('Only the party owner can kick members');
    }
    
    if (memberToKickId === ownerId) {
      throw new Error('You cannot kick yourself. Use leave party instead.');
    }
    
    // Check if member exists in party
    const memberExists = party.members.some(m => m.userId === memberToKickId);
    if (!memberExists) {
      throw new Error('Member not found in party');
    }
    
    // Remove member from party
    const updatedMembers = party.members.filter(m => m.userId !== memberToKickId);
    
    const partiesRef = getPartiesCollection();
    await partiesRef.doc(partyId).update({
      members: updatedMembers,
      memberCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Clear kicked member's party reference
    await userService.updateUser(memberToKickId, { partyId: null, partyRole: null });
    
    logger.info('Member kicked from party', { partyId, kickedBy: ownerId, kickedMember: memberToKickId });
    
    return { message: 'Member has been removed from the party' };
  } catch (error) {
    logger.error('Error kicking member', { error: error.message, ownerId, partyId, memberToKickId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createParty,
  getPartyById,
  getPartyByInviteCode,
  getUserParty,
  joinParty,
  leaveParty,
  getPartyMembers,
  updateParty,
  regenerateInviteCode,
  kickMember,
};

