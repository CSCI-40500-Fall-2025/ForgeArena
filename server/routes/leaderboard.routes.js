/**
 * Leaderboard Routes - API endpoints for leaderboards
 */

const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/social/leaderboard.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/leaderboard - Get leaderboard by type
 */
router.get('/', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const type = req.query.type || 'level';
    const limit = parseInt(req.query.limit) || 20;
    const gym = req.query.gym;
    
    const leaderboard = await leaderboardService.getLeaderboard(type, { limit, gym });
    
    // Get user's rank if authenticated
    let userRank = null;
    if (req.user) {
      userRank = await leaderboardService.getUserRank(req.user.uid, type);
    }
    
    logger.debug('Fetching leaderboard', {
      type,
      entries: leaderboard.length,
    });
    
    res.json({
      leaderboard,
      userRank,
      type,
    });
  } catch (error) {
    logger.error('Failed to fetch leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/overall - Get overall (level-based) leaderboard
 */
router.get('/overall', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getOverallLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch overall leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/weekly - Get weekly XP leaderboard
 */
router.get('/weekly', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch weekly leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/streak - Get streak leaderboard
 */
router.get('/streak', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getStreakLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch streak leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/workouts - Get total workouts leaderboard
 */
router.get('/workouts', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getWorkoutsLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch workouts leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/reps - Get lifetime reps leaderboard
 */
router.get('/reps', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getRepsLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch reps leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/raids - Get raid completions leaderboard
 */
router.get('/raids', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getRaidLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch raid leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/duels - Get duel wins leaderboard
 */
router.get('/duels', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getDuelLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch duel leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/gym/:gym - Get gym-specific leaderboard
 */
router.get('/gym/:gym', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getGymLeaderboard(req.params.gym, limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch gym leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/clubs - Get club leaderboard
 */
router.get('/clubs', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await leaderboardService.getClubLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to fetch club leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/stats - Get user's leaderboard stats
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const stats = await leaderboardService.getUserLeaderboardStats(req.user.uid);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch leaderboard stats', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/leaderboard/rank/:type - Get user's rank for a specific leaderboard
 */
router.get('/rank/:type', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const rank = await leaderboardService.getUserRank(req.user.uid, req.params.type);
    res.json(rank);
  } catch (error) {
    logger.error('Failed to fetch user rank', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



