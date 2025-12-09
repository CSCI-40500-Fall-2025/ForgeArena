/**
 * Quest Routes - API endpoints for quest management
 */

const express = require('express');
const router = express.Router();
const questService = require('../services/gameplay/quest.service');
const userService = require('../services/user/user.service');
const activityService = require('../services/shared/activity.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/quests - Get user's active quests
 */
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Refresh expired quests and generate new ones
    await questService.refreshQuests(user);
    
    // Get active quests
    const quests = await questService.getUserQuests(user.uid);
    
    // Get available milestones
    const milestones = await questService.getAvailableMilestoneQuests(user);
    
    logger.debug('Fetching quests', {
      userId: user.uid,
      activeQuests: quests.length,
      milestones: milestones.length,
    });
    
    res.json({
      daily: quests.filter(q => q.type === 'daily'),
      weekly: quests.filter(q => q.type === 'weekly'),
      milestones: milestones.slice(0, 5),
      all: quests,
    });
  } catch (error) {
    logger.error('Failed to fetch quests', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quests/all - Get all quests (including completed)
 */
router.get('/all', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const quests = await questService.getAllUserQuests(req.user.uid, limit);
    res.json(quests);
  } catch (error) {
    logger.error('Failed to fetch all quests', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/:questId/claim - Claim quest reward
 */
router.post('/:questId/claim', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { questId } = req.params;
    const user = req.user;
    
    const reward = await questService.claimQuestReward(user.uid, questId);
    
    // Update user XP
    const newXP = (user.xp || 0) + reward.xpReward;
    const xpPerLevel = 100;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    const leveledUp = newLevel > (user.level || 1);
    
    await userService.updateUser(user.uid, {
      xp: newXP,
      level: newLevel,
      weeklyXP: (user.weeklyXP || 0) + reward.xpReward,
    });
    
    // Log activity
    await activityService.logQuestCompleteActivity(
      user.uid, 
      user.username, 
      reward.quest.title, 
      reward.xpReward
    );
    
    logger.info('Quest reward claimed', {
      userId: user.uid,
      questId,
      xpGained: reward.xpReward,
      leveledUp,
    });
    
    res.json({
      message: 'Quest completed!',
      xpGained: reward.xpReward,
      rewardItem: reward.rewardItem,
      newLevel,
      leveledUp,
    });
  } catch (error) {
    logger.error('Failed to claim quest', { error: error.message, userId: req.user?.uid });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/quests/refresh - Force refresh quests
 */
router.post('/refresh', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const newQuests = await questService.refreshQuests(req.user);
    res.json({
      message: 'Quests refreshed',
      newQuests: newQuests.length,
      quests: newQuests,
    });
  } catch (error) {
    logger.error('Failed to refresh quests', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/quests/initialize - Initialize quests for new user
 */
router.post('/initialize', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const quests = await questService.initializeUserQuests(req.user);
    res.json({
      message: 'Quests initialized',
      quests,
    });
  } catch (error) {
    logger.error('Failed to initialize quests', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


