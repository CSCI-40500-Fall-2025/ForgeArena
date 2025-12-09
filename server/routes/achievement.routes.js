/**
 * Achievement Routes - API endpoints for achievements
 */

const express = require('express');
const router = express.Router();
const achievementService = require('../services/gameplay/achievement.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/achievements - Get all achievements with unlock status
 */
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const achievements = await achievementService.getUserAchievements(req.user.uid);
    const stats = await achievementService.getAchievementStats(req.user.uid);
    
    logger.debug('Fetching achievements', {
      userId: req.user.uid,
      total: stats.total,
      unlocked: stats.unlocked,
    });
    
    res.json({
      achievements,
      stats,
    });
  } catch (error) {
    logger.error('Failed to fetch achievements', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements/unlocked - Get only unlocked achievements
 */
router.get('/unlocked', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const achievements = await achievementService.getUnlockedAchievements(req.user.uid);
    res.json(achievements);
  } catch (error) {
    logger.error('Failed to fetch unlocked achievements', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements/stats - Get achievement statistics
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const stats = await achievementService.getAchievementStats(req.user.uid);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch achievement stats', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements/progress - Get progress for all achievements
 */
router.get('/progress', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userStats = {
      totalWorkouts: req.user.totalWorkouts || 0,
      lifetimeReps: req.user.lifetimeReps || 0,
      workoutStreak: req.user.workoutStreak || 0,
      level: req.user.level || 1,
      duelWins: req.user.duelWins || 0,
      raidsCompleted: req.user.raidsCompleted || 0,
      totalRaidDamage: req.user.totalRaidDamage || 0,
    };
    
    const progress = await achievementService.getAchievementProgress(req.user.uid, userStats);
    res.json(progress);
  } catch (error) {
    logger.error('Failed to fetch achievement progress', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/achievements/check - Check and unlock any earned achievements
 */
router.post('/check', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userStats = {
      totalWorkouts: req.user.totalWorkouts || 0,
      lifetimeReps: req.user.lifetimeReps || 0,
      workoutStreak: req.user.workoutStreak || 0,
      level: req.user.level || 1,
      duelWins: req.user.duelWins || 0,
      raidsCompleted: req.user.raidsCompleted || 0,
      totalRaidDamage: req.user.totalRaidDamage || 0,
      territoriesCaptured: req.user.territoriesCaptured || 0,
      clubsFounded: req.user.clubsFounded || 0,
      partiesCreated: req.user.partiesCreated || 0,
    };
    
    const newAchievements = await achievementService.checkAndUnlockAchievements(
      req.user.uid, 
      userStats
    );
    
    res.json({
      newAchievements,
      count: newAchievements.length,
    });
  } catch (error) {
    logger.error('Failed to check achievements', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



