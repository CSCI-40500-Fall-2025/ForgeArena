const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const authMiddleware = require('../middleware/auth.middleware');
const authUtils = require('../utils/auth.utils');
const logger = require('../utils/logger');

/**
 * GET /api/user/profile
 * Get current user's profile
 */
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    logger.debug('Fetching user profile', {
      uid: user.uid,
      username: user.username,
      action: 'USER_PROFILE',
    });
    
    res.json(user);
  } catch (error) {
    logger.error('Failed to fetch user profile', {
      error: error.message,
      uid: req.user?.uid,
      action: 'USER_PROFILE',
    });
    
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
router.put('/profile', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    logger.debug('Updating user profile', {
      uid: user.uid,
      updates: Object.keys(updates),
      action: 'USER_PROFILE_UPDATE',
    });
    
    const updatedUser = await userService.updateUser(user.uid, updates);
    
    logger.info('User profile updated', {
      uid: user.uid,
      updates: Object.keys(updates),
      action: 'USER_PROFILE_UPDATE',
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Failed to update user profile', {
      error: error.message,
      uid: req.user?.uid,
      action: 'USER_PROFILE_UPDATE',
    });
    
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/user/handle
 * Update user's handle
 */
router.put('/handle', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { handle } = req.body;
    
    if (!handle) {
      return res.status(400).json({ error: 'Handle is required' });
    }
    
    // Validate handle format
    const validation = authUtils.validateHandle(handle);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    // Check if handle is available
    const isAvailable = await userService.isHandleAvailable(handle);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Handle is already taken' });
    }
    
    // Update handle
    const updatedUser = await userService.updateUser(user.uid, { handle });
    
    logger.info('User handle updated', {
      uid: user.uid,
      oldHandle: user.handle,
      newHandle: handle,
      action: 'HANDLE_UPDATE',
    });
    
    res.json({
      message: 'Handle updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Failed to update handle', {
      error: error.message,
      uid: req.user?.uid,
      action: 'HANDLE_UPDATE',
    });
    
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/user/handle/:handle/availability
 * Check if a handle is available
 */
router.get('/handle/:handle/availability', async (req, res) => {
  try {
    const { handle } = req.params;
    
    // Validate handle format
    const validation = authUtils.validateHandle(handle);
    if (!validation.valid) {
      return res.status(400).json({ 
        available: false, 
        error: validation.message 
      });
    }
    
    const isAvailable = await userService.isHandleAvailable(handle);
    
    res.json({ available: isAvailable });
  } catch (error) {
    logger.error('Failed to check handle availability', {
      error: error.message,
      handle: req.params.handle,
    });
    
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

module.exports = router;

