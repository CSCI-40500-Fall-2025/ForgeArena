/**
 * Duel Routes - API endpoints for duel management
 */

const express = require('express');
const router = express.Router();
const duelService = require('../services/gameplay/duel.service');
const activityService = require('../services/shared/activity.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/duels/challenges - Get available duel challenges
 */
router.get('/challenges', authMiddleware.authenticateToken, (req, res) => {
  res.json(duelService.getAvailableChallenges());
});

/**
 * GET /api/duels - Get user's duels
 */
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const [activeDuels, pendingInvitations, stats] = await Promise.all([
      duelService.getUserActiveDuels(req.user.uid),
      duelService.getPendingInvitations(req.user.uid),
      duelService.getDuelStats(req.user.uid),
    ]);
    
    logger.debug('Fetching duels', {
      userId: req.user.uid,
      activeDuels: activeDuels.length,
      pendingInvitations: pendingInvitations.length,
    });
    
    res.json({
      active: activeDuels,
      pending: pendingInvitations,
      stats,
    });
  } catch (error) {
    logger.error('Failed to fetch duels', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duels/history - Get duel history
 */
router.get('/history', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const duels = await duelService.getUserDuels(req.user.uid, limit);
    res.json(duels);
  } catch (error) {
    logger.error('Failed to fetch duel history', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duels/stats - Get duel statistics
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const stats = await duelService.getDuelStats(req.user.uid);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to fetch duel stats', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duels - Create a new duel
 */
router.post('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { opponent, challenge } = req.body;
    const user = req.user;
    
    if (!opponent || !challenge) {
      return res.status(400).json({ error: 'Opponent and challenge are required' });
    }
    
    const duel = await duelService.createDuel(user.uid, user.username, opponent, challenge);
    
    // Log activity
    await activityService.logDuelChallengeActivity(user.uid, user.username, opponent);
    
    logger.info('Duel created', {
      userId: user.uid,
      duelId: duel.id,
      opponent,
      challenge,
    });
    
    res.json({
      message: `Duel challenge sent to ${opponent}!`,
      duel,
    });
  } catch (error) {
    logger.error('Failed to create duel', { error: error.message, userId: req.user?.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/duels/:duelId/accept - Accept a duel
 */
router.post('/:duelId/accept', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const duel = await duelService.acceptDuel(req.user.uid, req.params.duelId);
    
    logger.info('Duel accepted', {
      userId: req.user.uid,
      duelId: req.params.duelId,
    });
    
    res.json({ message: 'Duel accepted!', duel });
  } catch (error) {
    logger.error('Failed to accept duel', { error: error.message, userId: req.user?.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/duels/:duelId/decline - Decline a duel
 */
router.post('/:duelId/decline', authMiddleware.authenticateToken, async (req, res) => {
  try {
    await duelService.declineDuel(req.user.uid, req.params.duelId);
    
    logger.info('Duel declined', {
      userId: req.user.uid,
      duelId: req.params.duelId,
    });
    
    res.json({ message: 'Duel declined' });
  } catch (error) {
    logger.error('Failed to decline duel', { error: error.message, userId: req.user?.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/duels/:duelId - Get specific duel details
 */
router.get('/:duelId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const duels = await duelService.getUserDuels(req.user.uid, 100);
    const duel = duels.find(d => d.id === req.params.duelId);
    
    if (!duel) {
      return res.status(404).json({ error: 'Duel not found' });
    }
    
    res.json(duel);
  } catch (error) {
    logger.error('Failed to fetch duel', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


