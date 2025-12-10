/**
 * Raid Routes - API endpoints for party raid battles
 */

const express = require('express');
const router = express.Router();
const raidService = require('../services/gameplay/raid.service');
const partyService = require('../services/social/party.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// ============================================================================
// BOSS ROUTES
// ============================================================================

/**
 * GET /api/raids/bosses - Get available bosses with scaled HP preview
 */
router.get('/bosses', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const memberCount = parseInt(req.query.members) || 1;
    const bosses = raidService.getAvailableBosses(memberCount);
    res.json(bosses);
  } catch (error) {
    logger.error('Error fetching bosses', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/raids/bosses/:bossId - Get specific boss details
 */
router.get('/bosses/:bossId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const boss = raidService.getBossById(req.params.bossId);
    
    if (!boss) {
      return res.status(404).json({ error: 'Boss not found' });
    }
    
    const memberCount = parseInt(req.query.members) || 1;
    res.json({
      ...boss,
      scaledHp: raidService.calculateScaledHp(boss, memberCount),
    });
  } catch (error) {
    logger.error('Error fetching boss', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RAID ROUTES
// ============================================================================

/**
 * GET /api/raids/active - Get user's active raid (via their party)
 */
router.get('/active', authMiddleware.authenticateToken, async (req, res) => {
  try {
    // Get user's party
    const party = await partyService.getUserParty(req.user.uid);
    
    if (!party) {
      return res.json({ raid: null, party: null });
    }
    
    // Get active raid for the party
    const raid = await raidService.getActiveRaid(party.id);
    
    if (raid) {
      // Get contribution leaderboard
      const leaderboard = await raidService.getContributionLeaderboard(raid.id);
      
      return res.json({
        raid: {
          ...raid,
          leaderboard,
        },
        party,
      });
    }
    
    res.json({ raid: null, party });
  } catch (error) {
    logger.error('Error fetching active raid', { error: error.message, userId: req.user.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/raids/start - Start a new raid (owner only)
 */
router.post('/start', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { bossId } = req.body;
    
    if (!bossId) {
      return res.status(400).json({ error: 'Boss ID is required' });
    }
    
    // Get user's party
    const party = await partyService.getUserParty(req.user.uid);
    
    if (!party) {
      return res.status(400).json({ error: 'You must be in a party to start a raid' });
    }
    
    const raid = await raidService.startRaid(req.user.uid, party.id, bossId);
    
    logger.info('Raid started via API', { 
      raidId: raid.id, 
      partyId: party.id, 
      bossId,
      userId: req.user.uid 
    });
    
    res.status(201).json({ raid });
  } catch (error) {
    logger.error('Error starting raid', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/raids/:raidId/damage - Log damage to the boss
 */
router.post('/:raidId/damage', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { damage, source } = req.body;
    
    if (typeof damage !== 'number' || damage <= 0) {
      return res.status(400).json({ error: 'Valid damage amount is required' });
    }
    
    const result = await raidService.logDamage(
      req.user.uid,
      req.params.raidId,
      damage,
      source || 'workout'
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error logging damage', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/raids/:raidId/workout-damage - Calculate and log damage from workout
 */
router.post('/:raidId/workout-damage', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { exercise, reps } = req.body;
    
    if (!exercise || typeof reps !== 'number' || reps <= 0) {
      return res.status(400).json({ error: 'Exercise and valid reps are required' });
    }
    
    // Calculate damage based on workout
    const userLevel = req.user.level || 1;
    const damage = raidService.calculateWorkoutDamage(exercise, reps, userLevel);
    
    const result = await raidService.logDamage(
      req.user.uid,
      req.params.raidId,
      damage,
      `${exercise} x${reps}`
    );
    
    res.json({
      ...result,
      exercise,
      reps,
    });
  } catch (error) {
    logger.error('Error logging workout damage', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/raids/:raidId - Get raid details
 */
router.get('/:raidId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const raid = await raidService.getRaidById(req.params.raidId);
    
    if (!raid) {
      return res.status(404).json({ error: 'Raid not found' });
    }
    
    // Verify user is a participant
    if (!raid.contributions[req.user.uid]) {
      return res.status(403).json({ error: 'You are not a participant in this raid' });
    }
    
    // Get contribution leaderboard
    const leaderboard = await raidService.getContributionLeaderboard(req.params.raidId);
    
    res.json({
      ...raid,
      leaderboard,
    });
  } catch (error) {
    logger.error('Error fetching raid', { error: error.message, raidId: req.params.raidId });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/raids/:raidId/leaderboard - Get contribution leaderboard
 */
router.get('/:raidId/leaderboard', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const leaderboard = await raidService.getContributionLeaderboard(req.params.raidId);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error fetching leaderboard', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/raids/:raidId/abandon - Abandon the raid (owner only)
 */
router.post('/:raidId/abandon', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await raidService.abandonRaid(req.user.uid, req.params.raidId);
    
    logger.info('Raid abandoned via API', { 
      raidId: req.params.raidId, 
      userId: req.user.uid 
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error abandoning raid', { error: error.message, userId: req.user.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/raids/history/:partyId - Get raid history for a party
 */
router.get('/history/:partyId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await raidService.getRaidHistory(req.params.partyId, limit);
    res.json(history);
  } catch (error) {
    logger.error('Error fetching raid history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;




