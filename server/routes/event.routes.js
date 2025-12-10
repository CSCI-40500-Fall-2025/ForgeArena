// ============================================
// EVENT API ROUTES
// ============================================

const express = require('express');
const router = express.Router();

const eventService = require('../services/shared/event.service');

/**
 * GET /api/events
 * Get all active events
 */
router.get('/', (req, res) => {
  try {
    const events = eventService.getActiveEvents();
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/:eventId
 * Get specific event details with user progress
 */
router.get('/:eventId', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { eventId } = req.params;
    
    const event = eventService.EVENTS[eventId];
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    const progress = eventService.getUserEventProgress(userId, eventId);
    const { canClaim, reason } = eventService.canClaimEventReward(userId, eventId);
    
    res.json({
      success: true,
      event,
      progress,
      canClaim,
      claimBlockReason: canClaim ? null : reason
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/events/:eventId/claim
 * Claim event reward
 */
router.post('/:eventId/claim', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const { eventId } = req.params;
    
    const result = eventService.claimEventReward(userId, eventId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Event reward claimed! +${result.xp} XP`,
        ...result
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/:eventId/leaderboard
 * Get event leaderboard (for raid events)
 */
router.get('/:eventId/leaderboard', (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderboard = eventService.getEventLeaderboard(eventId);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/events/user/progress
 * Get user's progress for all active events
 */
router.get('/user/progress', (req, res) => {
  try {
    const userId = req.user?.id || 'default_user';
    const activeEvents = eventService.getActiveEvents();
    
    const progressList = activeEvents.map(event => ({
      eventId: event.id,
      eventName: event.name,
      ...eventService.getUserEventProgress(userId, event.id),
      ...eventService.canClaimEventReward(userId, event.id)
    }));
    
    res.json({ success: true, progress: progressList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;




