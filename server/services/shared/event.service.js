// ============================================
// EVENT SERVICE - Time-based events and rewards
// ============================================

const itemService = require('./item.service');
const { generateItem, RARITY, SLOT } = require('../../shared/itemSystem');

// ============================================
// EVENT DEFINITIONS
// ============================================

const EVENTS = {
  // Daily events
  daily_login: {
    id: 'daily_login',
    name: 'Daily Login Bonus',
    description: 'Log in daily to earn rewards!',
    type: 'daily',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    rewards: {
      xp: 25,
      itemType: 'daily'
    }
  },
  
  // Weekly events
  weekly_warrior: {
    id: 'weekly_warrior',
    name: 'Weekly Warrior Challenge',
    description: 'Complete 7 workouts this week',
    type: 'weekly',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    requirement: { workouts: 7 },
    rewards: {
      xp: 500,
      itemType: 'weekly'
    }
  },
  
  // Special seasonal events
  summer_shred: {
    id: 'summer_shred',
    name: 'Summer Shred Challenge',
    description: 'Get beach-ready with this special summer event!',
    type: 'seasonal',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-08-31'),
    rewards: {
      xp: 1000,
      itemType: 'seasonal',
      guaranteedSlots: [SLOT.SHIRT, SLOT.SHORTS]
    }
  },
  
  winter_warrior: {
    id: 'winter_warrior',
    name: 'Winter Warrior Challenge',
    description: 'Stay strong through the cold months!',
    type: 'seasonal',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2026-02-28'),
    rewards: {
      xp: 1000,
      itemType: 'seasonal',
      guaranteedSlots: [SLOT.JACKET, SLOT.GLOVES]
    }
  },
  
  // Limited time events
  new_year_resolution: {
    id: 'new_year_resolution',
    name: 'New Year Resolution',
    description: 'Start the year strong! Complete 10 workouts in January.',
    type: 'special',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    requirement: { workouts: 10 },
    rewards: {
      xp: 750,
      itemType: 'special',
      guaranteedRarity: RARITY.EPIC
    }
  },
  
  // Raid events
  titan_takedown: {
    id: 'titan_takedown',
    name: 'Titan Takedown',
    description: 'Join forces to defeat the Titan! Community raid event.',
    type: 'raid_event',
    duration: 3 * 24 * 60 * 60 * 1000, // 3 days
    rewards: {
      xp: 300,
      itemType: 'raid',
      participationLevel: 'high'
    }
  },
  
  // Achievement-based events
  first_legendary: {
    id: 'first_legendary',
    name: 'Legendary Discovery',
    description: 'Find your first legendary item!',
    type: 'achievement',
    oneTime: true,
    rewards: {
      xp: 200,
      guaranteedRarity: RARITY.LEGENDARY
    }
  }
};

// User event progress storage (in-memory, replace with DB)
const userEventProgress = new Map();
const userEventClaims = new Map();

// ============================================
// EVENT FUNCTIONS
// ============================================

/**
 * Gets all currently active events
 */
const getActiveEvents = () => {
  const now = new Date();
  const activeEvents = [];
  
  for (const event of Object.values(EVENTS)) {
    let isActive = false;
    
    switch (event.type) {
      case 'daily':
      case 'weekly':
        isActive = true; // Always active
        break;
      case 'seasonal':
      case 'special':
        isActive = event.startDate <= now && now <= event.endDate;
        break;
      case 'raid_event':
        // Check if raid event is running
        isActive = true; // Simplified - always active for demo
        break;
      case 'achievement':
        isActive = true; // Achievement events are always available
        break;
    }
    
    if (isActive) {
      activeEvents.push({
        ...event,
        isActive: true,
        timeRemaining: event.endDate ? event.endDate - now : null
      });
    }
  }
  
  return activeEvents;
};

/**
 * Gets user's progress for an event
 */
const getUserEventProgress = (userId, eventId) => {
  const key = `${userId}_${eventId}`;
  return userEventProgress.get(key) || { progress: 0, completed: false };
};

/**
 * Updates user's progress for an event
 */
const updateEventProgress = (userId, eventId, progressDelta) => {
  const event = EVENTS[eventId];
  if (!event) return null;
  
  const key = `${userId}_${eventId}`;
  const current = getUserEventProgress(userId, eventId);
  
  current.progress += progressDelta;
  
  // Check if requirement met
  if (event.requirement) {
    const reqKey = Object.keys(event.requirement)[0];
    const reqValue = event.requirement[reqKey];
    
    if (current.progress >= reqValue) {
      current.completed = true;
    }
  }
  
  userEventProgress.set(key, current);
  return current;
};

/**
 * Checks if user can claim event reward
 */
const canClaimEventReward = (userId, eventId) => {
  const event = EVENTS[eventId];
  if (!event) return { canClaim: false, reason: 'Event not found' };
  
  const claimKey = `${userId}_${eventId}`;
  const lastClaim = userEventClaims.get(claimKey);
  
  // Check one-time events
  if (event.oneTime && lastClaim) {
    return { canClaim: false, reason: 'Already claimed' };
  }
  
  // Check daily reset
  if (event.type === 'daily') {
    const now = new Date();
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim);
      if (lastClaimDate.toDateString() === now.toDateString()) {
        return { canClaim: false, reason: 'Already claimed today' };
      }
    }
  }
  
  // Check weekly reset
  if (event.type === 'weekly') {
    const now = new Date();
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      if (lastClaimDate >= weekStart) {
        return { canClaim: false, reason: 'Already claimed this week' };
      }
    }
  }
  
  // Check if requirements are met
  if (event.requirement) {
    const progress = getUserEventProgress(userId, eventId);
    if (!progress.completed) {
      return { canClaim: false, reason: 'Requirements not met' };
    }
  }
  
  return { canClaim: true };
};

/**
 * Claims event reward
 */
const claimEventReward = (userId, eventId) => {
  const event = EVENTS[eventId];
  if (!event) {
    return { success: false, error: 'Event not found' };
  }
  
  const { canClaim, reason } = canClaimEventReward(userId, eventId);
  if (!canClaim) {
    return { success: false, error: reason };
  }
  
  const rewards = event.rewards;
  const result = {
    success: true,
    xp: rewards.xp || 0,
    items: []
  };
  
  // Generate item rewards
  if (rewards.itemType) {
    const itemResult = itemService.awardEventItems(userId, rewards.itemType);
    result.items = itemResult.items;
  }
  
  // Handle guaranteed slots
  if (rewards.guaranteedSlots) {
    for (const slot of rewards.guaranteedSlots) {
      const item = generateItem({ 
        slot, 
        source: 'event',
        rarity: rewards.guaranteedRarity || null
      });
      itemService.addItemToInventory(userId, item);
      result.items.push(item);
    }
  }
  
  // Handle guaranteed rarity
  if (rewards.guaranteedRarity && !rewards.guaranteedSlots) {
    const item = generateItem({ 
      rarity: rewards.guaranteedRarity,
      source: 'event'
    });
    itemService.addItemToInventory(userId, item);
    result.items.push(item);
  }
  
  // Record claim
  const claimKey = `${userId}_${eventId}`;
  userEventClaims.set(claimKey, new Date().toISOString());
  
  // Reset progress for repeatable events
  if (!event.oneTime) {
    const progressKey = `${userId}_${eventId}`;
    userEventProgress.set(progressKey, { progress: 0, completed: false });
  }
  
  return result;
};

/**
 * Processes workout for event progress
 */
const processWorkoutForEvents = (userId) => {
  const updates = [];
  
  // Update weekly warrior progress
  const weeklyProgress = updateEventProgress(userId, 'weekly_warrior', 1);
  if (weeklyProgress) {
    updates.push({
      eventId: 'weekly_warrior',
      progress: weeklyProgress.progress,
      completed: weeklyProgress.completed
    });
  }
  
  // Update any active seasonal events
  const activeEvents = getActiveEvents();
  for (const event of activeEvents) {
    if (event.requirement?.workouts) {
      const progress = updateEventProgress(userId, event.id, 1);
      if (progress) {
        updates.push({
          eventId: event.id,
          progress: progress.progress,
          completed: progress.completed
        });
      }
    }
  }
  
  return updates;
};

/**
 * Gets event leaderboard (for raid events)
 */
const getEventLeaderboard = (eventId) => {
  // Simplified mock leaderboard
  return [
    { rank: 1, username: 'GymHero99', contribution: 2500 },
    { rank: 2, username: 'FitWarrior', contribution: 2100 },
    { rank: 3, username: 'StrengthMaster', contribution: 1800 },
    { rank: 4, username: 'TestWarrior', contribution: 1500 },
    { rank: 5, username: 'CardioQueen', contribution: 1200 }
  ];
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  EVENTS,
  getActiveEvents,
  getUserEventProgress,
  updateEventProgress,
  canClaimEventReward,
  claimEventReward,
  processWorkoutForEvents,
  getEventLeaderboard
};


