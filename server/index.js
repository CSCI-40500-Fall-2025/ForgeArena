const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const userService = require('./services/user.service');

const app = express();
const PORT = process.env.PORT || 5000;

// INFO: Server initialization
logger.info('Initializing ForgeArena server...', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
});

// Initialize user database
userService.initUsersDb().catch(err => {
  logger.error('Failed to initialize users database', { error: err.message });
});

// Middleware
app.use(cors());
app.use(express.json());

// HTTP request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[level](`${req.method} ${req.path} ${res.statusCode}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
});

// Import shared data and logic
const { 
  mockUser, 
  mockQuests, 
  mockAchievements, 
  mockDuels, 
  mockActivityFeed, 
  mockRaidBoss, 
  mockGyms 
} = require('../shared/mockData');

const { 
  processWorkout, 
  getLeaderboard, 
  getInventory 
} = require('../shared/gameLogic');

// DEBUG: Data loaded successfully
logger.debug('Mock data and game logic loaded', {
  questCount: mockQuests.length,
  achievementCount: mockAchievements.length,
  gymCount: mockGyms.length,
});

// ============================================================================
// API Routes
// ============================================================================

// Auth routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const mlRoutes = require('./routes/ml.routes');
const avatarRoutes = require('./routes/avatar.routes');
const eventRoutes = require('./routes/event.routes');
const clubRoutes = require('./routes/club.routes');
const authMiddleware = require('./middleware/auth.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);

// INFO: ML Service initialized
logger.info('ForgeMaster AI (ML Service) initialized', {
  features: ['recommendations', 'predictions', 'motivation', 'quest-suggestions', 'patterns'],
  engine: process.env.GEMINI_API_KEY ? 'gemini_enhanced' : 'rule_based_ai',
  geminiEnabled: !!process.env.GEMINI_API_KEY
});

// INFO: Clubs & Territory System initialized
logger.info('Clubs & Territory System initialized', {
  features: ['clubs', 'territories', 'battles', 'leaderboard'],
  googlePlacesEnabled: !!process.env.GOOGLE_PLACES_API_KEY
});

// Get user profile (legacy - will be replaced by /api/user/profile)
app.get('/api/user', authMiddleware.optionalAuth, (req, res) => {
  // If authenticated, use their profile
  if (req.user) {
    return res.json(req.user);
  }
  
  // Otherwise, use mock user for backwards compatibility
  logger.debug('Fetching user profile', {
    userId: mockUser.id,
    username: mockUser.username,
    action: 'USER_PROFILE',
  });
  
  res.json(mockUser);
});

// Process workout (now requires authentication)
app.post('/api/workout', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { exercise, reps } = req.body;
    
    // DEBUG: Workout submission details
    logger.debug('Processing workout submission', {
      userId: mockUser.id,
      exercise,
      reps,
      action: 'WORKOUT',
    });
    
    const result = await processWorkout(exercise, reps);
    
    // INFO: Workout processed successfully
    logger.info('Workout completed', {
      userId: mockUser.id,
      exercise,
      reps,
      xpEarned: result.xpEarned || 0,
      action: 'WORKOUT',
    });
    
    res.json(result);
  } catch (error) {
    // ERROR: Workout processing failed
    logger.error('Workout processing failed', {
      userId: mockUser.id,
      exercise: req.body.exercise,
      reps: req.body.reps,
      error: error.message,
      stack: error.stack,
      action: 'WORKOUT',
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Get all quests
app.get('/api/quests', (req, res) => {
  logger.debug('Fetching quests list', {
    userId: mockUser.id,
    totalQuests: mockQuests.length,
    action: 'QUEST',
  });
  
  res.json(mockQuests);
});

// Complete a quest
app.post('/api/quest/:id/complete', (req, res) => {
  const questId = req.params.id;
  const quest = mockQuests.find(q => q.id == questId);
  const itemService = require('./services/item.service');
  
  if (quest) {
    // DEBUG: Quest completion validation
    logger.debug('Processing quest completion', {
      userId: mockUser.id,
      questId,
      questName: quest.name,
      xpReward: quest.xpReward,
      action: 'QUEST',
    });
    
    // Check if already completed
    if (quest.completed) {
      logger.warn('Quest already completed', {
        userId: mockUser.id,
        questId,
        questName: quest.name,
        action: 'QUEST',
      });
      return res.status(400).json({ message: 'Quest already completed' });
    }
    
    const oldLevel = mockUser.avatar.level;
    const oldXp = mockUser.avatar.xp;
    
    quest.completed = true;
    mockUser.avatar.xp += quest.xpReward;
    
    // Calculate if leveled up (simplified)
    const newLevel = Math.floor(mockUser.avatar.xp / 100) + 1;
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      mockUser.avatar.level = newLevel;
      
      // INFO: Level up event
      logger.info('User leveled up!', {
        userId: mockUser.id,
        questId,
        oldLevel,
        newLevel,
        totalXp: mockUser.avatar.xp,
        action: 'LEVEL_UP',
      });
    }
    
    // Award item rewards based on quest difficulty
    const questDifficulty = quest.xpReward >= 300 ? 'legendary' : 
                           quest.xpReward >= 150 ? 'hard' : 
                           quest.xpReward >= 100 ? 'normal' : 'easy';
    const itemReward = itemService.awardQuestItems('default_user', questDifficulty);
    
    // INFO: Quest completed
    logger.info('Quest completed successfully', {
      userId: mockUser.id,
      questId,
      questName: quest.name,
      xpGained: quest.xpReward,
      oldXp,
      newXp: mockUser.avatar.xp,
      leveledUp,
      itemsAwarded: itemReward.items.length,
      action: 'QUEST',
    });
    
    res.json({ 
      message: 'Quest completed!', 
      xpGained: quest.xpReward,
      leveledUp,
      newLevel: mockUser.avatar.level,
      itemReward: itemReward.items
    });
  } else {
    // WARN: Quest not found
    logger.warn('Quest not found', {
      userId: mockUser.id,
      requestedQuestId: questId,
      action: 'QUEST',
    });
    
    res.status(404).json({ message: 'Quest not found' });
  }
});

// Get raid boss
app.get('/api/raid', (req, res) => {
  logger.debug('Fetching raid boss data', {
    userId: mockUser.id,
    bossName: mockRaidBoss.name,
    bossHealth: mockRaidBoss.health,
    action: 'RAID',
  });
  
  res.json(mockRaidBoss);
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    logger.debug('Fetching leaderboard', {
      userId: mockUser.id,
      gym: mockUser.gym,
      action: 'LEADERBOARD',
    });
    
    const leaderboard = await getLeaderboard();
    
    // Find user's rank
    const userRank = leaderboard.findIndex(u => u.id === mockUser.id) + 1;
    
    logger.info('Leaderboard retrieved', {
      userId: mockUser.id,
      userRank,
      totalUsers: leaderboard.length,
      action: 'LEADERBOARD',
    });
    
    res.json(leaderboard);
  } catch (error) {
    // ERROR: Leaderboard fetch failed
    logger.error('Failed to fetch leaderboard', {
      userId: mockUser.id,
      error: error.message,
      stack: error.stack,
      action: 'LEADERBOARD',
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Get inventory
app.get('/api/inventory', async (req, res) => {
  try {
    logger.debug('Fetching user inventory', {
      userId: mockUser.id,
      inventorySize: mockUser.avatar.inventory.length,
      action: 'INVENTORY',
    });
    
    const inventory = await getInventory();
    res.json(inventory);
  } catch (error) {
    // ERROR: Inventory fetch failed
    logger.error('Failed to fetch inventory', {
      userId: mockUser.id,
      error: error.message,
      action: 'INVENTORY',
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Equip item
app.post('/api/equip/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const { mockEquipment } = require('../shared/mockData');
  const item = mockEquipment[itemId];
  
  // DEBUG: Equipment attempt
  logger.debug('Processing equipment request', {
    userId: mockUser.id,
    itemId,
    action: 'EQUIPMENT',
  });
  
  if (!item || !mockUser.avatar.inventory.includes(itemId)) {
    // WARN: Invalid equipment attempt
    logger.warn('Item not found in inventory', {
      userId: mockUser.id,
      requestedItemId: itemId,
      hasItem: !!item,
      inInventory: mockUser.avatar.inventory.includes(itemId),
      action: 'EQUIPMENT',
    });
    
    return res.status(400).json({ message: 'Item not found in inventory' });
  }

  // Unequip current item of same type
  const currentEquipped = mockUser.avatar.equipment[item.type];
  if (currentEquipped) {
    mockUser.avatar.inventory.push(currentEquipped);
  }

  // Equip new item
  mockUser.avatar.equipment[item.type] = itemId;
  mockUser.avatar.inventory = mockUser.avatar.inventory.filter(id => id !== itemId);

  // Apply stat bonuses
  Object.keys(item.stats).forEach(stat => {
    mockUser.avatar[stat] += item.stats[stat];
  });

  // INFO: Item equipped successfully
  logger.info('Item equipped', {
    userId: mockUser.id,
    itemId,
    itemName: item.name,
    itemType: item.type,
    statBoosts: item.stats,
    unequippedItem: currentEquipped,
    action: 'EQUIPMENT',
  });

  res.json({ 
    message: `Equipped ${item.name}!`, 
    equipment: mockUser.avatar.equipment 
  });
});

// Get achievements
app.get('/api/achievements', (req, res) => {
  logger.debug('Fetching achievements', {
    userId: mockUser.id,
    totalAchievements: mockAchievements.length,
    action: 'ACHIEVEMENT',
  });
  
  res.json(mockAchievements);
});

// Get duels
app.get('/api/duels', (req, res) => {
  logger.debug('Fetching duels list', {
    userId: mockUser.id,
    activeDuels: mockDuels.length,
    action: 'DUEL',
  });
  
  res.json(mockDuels);
});

// Create duel
app.post('/api/duel/create', (req, res) => {
  const { opponent, challenge } = req.body;
  
  // DEBUG: Duel creation
  logger.debug('Creating duel challenge', {
    userId: mockUser.id,
    challenger: mockUser.username,
    opponent,
    challenge,
    action: 'DUEL',
  });
  
  if (!opponent || !challenge) {
    logger.warn('Invalid duel parameters', {
      userId: mockUser.id,
      opponent,
      challenge,
      action: 'DUEL',
    });
    return res.status(400).json({ message: 'Opponent and challenge are required' });
  }
  
  const newDuel = {
    id: mockDuels.length + 1,
    challenger: mockUser.username,
    opponent,
    status: 'pending',
    challenge,
    deadline: new Date(Date.now() + 24*60*60*1000)
  };
  mockDuels.push(newDuel);
  
  // INFO: Duel created
  logger.info('Duel challenge created', {
    userId: mockUser.id,
    duelId: newDuel.id,
    challenger: mockUser.username,
    opponent,
    challenge,
    deadline: newDuel.deadline,
    action: 'DUEL',
  });
  
  res.json({ 
    message: `Duel challenge sent to ${opponent}!`, 
    duel: newDuel 
  });
});

// Get activity feed
app.get('/api/activity', (req, res) => {
  logger.debug('Fetching activity feed', {
    userId: mockUser.id,
    activityCount: mockActivityFeed.length,
    action: 'ACTIVITY',
  });
  
  res.json(mockActivityFeed);
});

// Get gyms list
app.get('/api/gyms', (req, res) => {
  logger.debug('Fetching gyms list', {
    userId: mockUser.id,
    currentGym: mockUser.gym,
    availableGyms: mockGyms.length,
    action: 'GYM',
  });
  
  res.json(mockGyms);
});

// Join gym
app.post('/api/gym/join/:gymId', (req, res) => {
  const gymId = req.params.gymId;
  
  const gymNames = {
    1: 'PowerHouse Fitness',
    2: 'Iron Paradise', 
    3: 'Flex Zone',
    4: 'Beast Mode Gym'
  };
  
  const gymName = gymNames[gymId];
  
  // DEBUG: Gym join attempt
  logger.debug('Processing gym join request', {
    userId: mockUser.id,
    requestedGymId: gymId,
    currentGym: mockUser.gym,
    action: 'GYM',
  });
  
  if (gymName) {
    const oldGym = mockUser.gym;
    mockUser.gym = gymName;
    
    // INFO: Gym joined successfully
    logger.info('User joined gym', {
      userId: mockUser.id,
      username: mockUser.username,
      oldGym,
      newGym: gymName,
      gymId,
      action: 'GYM',
    });
    
    res.json({ 
      message: `Joined ${gymName}!`, 
      gym: gymName 
    });
  } else {
    // WARN: Invalid gym ID
    logger.warn('Gym not found', {
      userId: mockUser.id,
      requestedGymId: gymId,
      action: 'GYM',
    });
    
    res.status(404).json({ message: 'Gym not found' });
  }
});

// ============================================================================
// Serve React App in Production
// ============================================================================

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 handler (only reached in development when no route matches)
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error in request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body,
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
  // INFO: Server started successfully
  logger.info(`ForgeArena server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Graceful Shutdown Handlers
// ============================================================================

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`, {
    signal,
    uptime: process.uptime(),
  });
  
  server.close(() => {
    logger.info('Server closed. All requests completed.', {
      signal,
    });
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout', {
      signal,
    });
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ERROR: Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
});

// ERROR: Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  
  // Give time for log to be written, then exit
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

module.exports = app; // Export for testing