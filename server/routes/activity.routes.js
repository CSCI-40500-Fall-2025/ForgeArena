/**
 * Activity Routes - API endpoints for activity feed
 */

const express = require('express');
const router = express.Router();
const activityService = require('../services/activity.service');
const authMiddleware = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * GET /api/activity - Get global activity feed
 */
router.get('/', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const activities = await activityService.getGlobalFeed(limit);
    
    logger.debug('Fetching global activity feed', {
      count: activities.length,
    });
    
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch activity feed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity/me - Get current user's activity feed
 */
router.get('/me', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await activityService.getUserFeed(req.user.uid, limit);
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch user activity', { error: error.message, userId: req.user?.uid });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity/user/:userId - Get specific user's activity feed
 */
router.get('/user/:userId', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await activityService.getUserFeed(req.params.userId, limit);
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch user activity', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity/club/:clubId - Get club's activity feed
 */
router.get('/club/:clubId', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const activities = await activityService.getClubFeed(req.params.clubId, limit);
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch club activity', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity/party/:partyId - Get party's activity feed
 */
router.get('/party/:partyId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const activities = await activityService.getPartyFeed(req.params.partyId, limit);
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch party activity', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity/type/:type - Get activities by type
 */
router.get('/type/:type', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await activityService.getActivitiesByType(req.params.type, limit);
    res.json(activities);
  } catch (error) {
    logger.error('Failed to fetch activities by type', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

