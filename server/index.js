const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const userService = require('./services/user/user.service');

// Import new services
const questService = require('./services/gameplay/quest.service');
const achievementService = require('./services/gameplay/achievement.service');
const duelService = require('./services/gameplay/duel.service');
const activityService = require('./services/shared/activity.service');
const leaderboardService = require('./services/social/leaderboard.service');

// Import ML data collector for production data collection
const { mlDataCollector } = require('./services/shared/ml-data-collector.service');

const app = express();
const PORT = process.env.PORT || 5000;

// INFO: Server initialization
logger.info('Initializing ForgeArena server...', {
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
});

// Initialize user database - MUST complete before accepting requests
let dbInitialized = false;
userService.initUsersDb()
  .then(() => {
    dbInitialized = true;
    logger.info('Database initialization complete - ready to accept requests');
  })
  .catch(err => {
    logger.error('Failed to initialize users database', { error: err.message });
    process.exit(1); // Exit if DB init fails
  });

// Middleware
app.use(cors());
app.use(express.json());

// Database readiness check middleware
app.use((req, res, next) => {
  if (!dbInitialized && !req.path.includes('/health')) {
    return res.status(503).json({ 
      error: 'Service temporarily unavailable', 
      message: 'Database is initializing, please try again in a moment' 
    });
  }
  next();
});

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

// Import game logic (updated to work with user data)
const { processWorkout } = require('../shared/game/gameLogic');

// DEBUG: Services loaded successfully
logger.debug('Services loaded', {
  services: ['quest', 'achievement', 'duel', 'activity', 'leaderboard'],
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
const partyRoutes = require('./routes/party.routes');
const raidRoutes = require('./routes/raid.routes');
const questRoutes = require('./routes/quest.routes');
const achievementRoutes = require('./routes/achievement.routes');
const duelRoutes = require('./routes/duel.routes');
const activityRoutes = require('./routes/activity.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const authMiddleware = require('./middleware/auth.middleware');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/raids', raidRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/duels', duelRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

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

// INFO: Party System initialized
logger.info('Party System initialized', {
  features: ['create', 'join-via-code', 'leave', 'ownership-transfer', 'kick-members'],
  maxPartySize: 8
});

// INFO: Raid System initialized
logger.info('Raid System initialized', {
  features: ['boss-selection', 'scaled-hp', 'real-time-damage', 'contribution-tracking'],
  bossCount: 5
});

// ============================================================================
// Health Check (Public)
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'forge-arena',
  });
});

// ============================================================================
// User API Routes (Authenticated)
// ============================================================================

// Get user profile
app.get('/api/user', authMiddleware.authenticateToken, (req, res) => {
  logger.debug('Fetching user profile', {
    userId: req.user.uid,
    username: req.user.username,
    action: 'USER_PROFILE',
  });
  
  res.json(req.user);
});

// Process workout (requires authentication)
app.post('/api/workout', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { exercise, reps } = req.body;
    const user = req.user;
    
    // Basic validation (tests expect error status when missing fields)
    if (!exercise || reps === undefined || reps === null) {
      return res.status(500).json({ error: 'Exercise and reps are required' });
    }
    
    logger.debug('Processing workout submission', {
      userId: user.uid,
      exercise,
      reps,
      action: 'WORKOUT',
    });
    
    // Calculate XP and level changes
    const result = await processWorkout(user, exercise, reps);
    
    // Update user stats in database
    const oldLevel = user.level;
    const newXP = (user.xp || 0) + result.xpGained;
    const xpPerLevel = 100;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    const leveledUp = newLevel > oldLevel;
    
    // Update user profile
    await userService.updateUser(user.uid, {
      xp: newXP,
      level: newLevel,
      totalWorkouts: (user.totalWorkouts || 0) + 1,
      lifetimeReps: (user.lifetimeReps || 0) + reps,
      weeklyXP: (user.weeklyXP || 0) + result.xpGained,
      workoutStreak: calculateStreak(user),
      lastWorkout: new Date().toISOString(),
    });
    
    // Get updated user stats for achievements
    const userStats = {
      totalWorkouts: (user.totalWorkouts || 0) + 1,
      lifetimeReps: (user.lifetimeReps || 0) + reps,
      workoutStreak: calculateStreak(user),
      level: newLevel,
    };
    
    // Process for quests, achievements, and duels
    const [questUpdates, newAchievements, duelUpdates] = await Promise.all([
      questService.processWorkoutForQuests(user.uid, { exercise, reps }),
      achievementService.processWorkoutForAchievements(user.uid, userStats),
      duelService.processWorkoutForDuels(user.uid, { exercise, reps }),
    ]);
    
    // Log activity
    await activityService.logWorkoutActivity(user.uid, user.username, exercise, reps);
    
    // Log level up if occurred
    if (leveledUp) {
      await activityService.logLevelUpActivity(user.uid, user.username, newLevel);
      logger.info('User leveled up!', {
        userId: user.uid,
        oldLevel,
        newLevel,
        totalXp: newXP,
        action: 'LEVEL_UP',
      });
    }
    
    // Log streak milestone if applicable
    const streak = calculateStreak(user);
    if ([3, 7, 14, 30, 60, 100].includes(streak)) {
      await activityService.logStreakMilestoneActivity(user.uid, user.username, streak);
    }
    
    logger.info('Workout completed', {
      userId: user.uid,
      exercise,
      reps,
      xpEarned: result.xpGained,
      newLevel,
      leveledUp,
      questsUpdated: questUpdates.length,
      achievementsUnlocked: newAchievements.length,
      action: 'WORKOUT',
    });
    
    // Collect workout data for ML assessment (production data collection)
    mlDataCollector.collectWorkoutData(user.uid, {
      exercise,
      reps,
      xpGained: result.xpGained,
      leveledUp,
      streak: streak
    });
    
    // Collect engagement signal for ML improvement
    mlDataCollector.collectEngagementSignal(user.uid, 'workout_completed', {
      exercise,
      reps,
      leveledUp,
      streak
    });
    
    res.json({
      ...result,
      newLevel,
      leveledUp,
      xpGained: result.xpGained,
      questUpdates,
      newAchievements,
      duelUpdates,
    });
  } catch (error) {
    logger.error('Workout processing failed', {
      userId: req.user?.uid,
      exercise: req.body.exercise,
      reps: req.body.reps,
      error: error.message,
      stack: error.stack,
      action: 'WORKOUT',
    });
    
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate workout streak
function calculateStreak(user) {
  if (!user.lastWorkout) return 1;
  
  const lastWorkout = new Date(user.lastWorkout);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if last workout was today (continuing streak)
  if (lastWorkout.toDateString() === today.toDateString()) {
    return user.workoutStreak || 1;
  }
  
  // Check if last workout was yesterday (streak continues)
  if (lastWorkout.toDateString() === yesterday.toDateString()) {
    return (user.workoutStreak || 0) + 1;
  }
  
  // Streak broken
  return 1;
}

// Note: Quest, Achievement, Duel, Activity, and Leaderboard routes are now 
// handled by their dedicated route files imported above.

// ============================================================================
// Legacy Raid Boss Route (for backward compatibility)
// ============================================================================

// Get current raid boss (uses the new raid system)
app.get('/api/raid', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const raidService = require('./services/gameplay/raid.service');
    const bosses = raidService.getAvailableBosses(1);
    
    // Return the first boss as "current" for backward compatibility
    const currentBoss = bosses[0];
    
    res.json({
      name: currentBoss.name,
      description: currentBoss.flavorText,
      totalHP: currentBoss.scaledHp,
      currentHP: currentBoss.scaledHp, // Start at full
      participants: 0,
      difficulty: currentBoss.difficulty,
    });
  } catch (error) {
    logger.error('Failed to fetch raid boss', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Inventory Routes
// ============================================================================

// Get inventory
app.get('/api/inventory', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const itemService = require('./services/shared/item.service');
    const inventory = itemService.getUserInventory(user.uid);
    
    logger.debug('Fetching user inventory', {
      userId: user.uid,
      itemCount: inventory.length,
      action: 'INVENTORY',
    });
    
    res.json(inventory);
  } catch (error) {
    logger.error('Failed to fetch inventory', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Equip item
app.post('/api/equip/:itemId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = req.user;
    const itemService = require('./services/shared/item.service');
    
    logger.debug('Processing equipment request', {
      userId: user.uid,
      itemId,
      action: 'EQUIPMENT',
    });
    
    const result = itemService.equipItem(user.uid, itemId);
    
    // Update user's equipment in database
    await userService.updateUser(user.uid, {
      equipment: result.equipment,
    });
    
    logger.info('Item equipped', {
      userId: user.uid,
      itemId,
      action: 'EQUIPMENT',
    });
    
    res.json({
      message: `Equipped ${result.item.name}!`,
      equipment: result.equipment,
    });
  } catch (error) {
    logger.error('Failed to equip item', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Gyms Routes (for club territories)
// ============================================================================

// Get gyms list (uses club system)
app.get('/api/gyms', authMiddleware.optionalAuth, async (req, res) => {
  try {
    // Return a list of gym territories
    const clubService = require('./services/social/club.service');
    const gyms = await clubService.getGymTerritories();
    res.json(gyms);
  } catch (error) {
    logger.error('Failed to fetch gyms', { error: error.message });
    res.status(500).json({ error: error.message });
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
