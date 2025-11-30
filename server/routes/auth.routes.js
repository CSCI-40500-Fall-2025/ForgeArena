const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth.utils');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are required',
      });
    }
    
    // Validate email format
    if (!authUtils.validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate username
    const usernameValidation = authUtils.validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.message });
    }
    
    // Validate password
    const passwordValidation = authUtils.validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }
    
    // Create user
    const user = await userService.createUser({ email, password, username });
    
    // Generate tokens
    const accessToken = authUtils.generateAccessToken({
      uid: user.uid,
      email: user.email,
    });
    
    const refreshToken = authUtils.generateRefreshToken({
      uid: user.uid,
      email: user.email,
    });
    
    logger.info('User registered successfully', {
      uid: user.uid,
      email: user.email,
      username: user.username,
      action: 'REGISTER',
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error('Registration failed', {
      error: error.message,
      email: req.body.email,
      action: 'REGISTER',
    });
    
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }
    
    // Verify credentials
    const user = await userService.verifyCredentials(email, password);
    
    // Generate tokens
    const accessToken = authUtils.generateAccessToken({
      uid: user.uid,
      email: user.email,
    });
    
    const refreshToken = authUtils.generateRefreshToken({
      uid: user.uid,
      email: user.email,
    });
    
    logger.info('User logged in successfully', {
      uid: user.uid,
      email: user.email,
      action: 'LOGIN',
    });
    
    res.json({
      message: 'Login successful',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.warn('Login failed', {
      error: error.message,
      email: req.body.email,
      action: 'LOGIN',
    });
    
    res.status(401).json({ error: error.message });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = authUtils.verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Get user
    const user = await userService.findUserByUid(decoded.uid);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    // Generate new access token
    const accessToken = authUtils.generateAccessToken({
      uid: user.uid,
      email: user.email,
    });
    
    logger.info('Token refreshed', {
      uid: user.uid,
      action: 'TOKEN_REFRESH',
    });
    
    res.json({
      message: 'Token refreshed',
      accessToken,
    });
  } catch (error) {
    logger.error('Token refresh failed', {
      error: error.message,
      action: 'TOKEN_REFRESH',
    });
    
    res.status(403).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should delete tokens)
 */
router.post('/logout', (req, res) => {
  // In a JWT-based system, logout is primarily handled client-side
  // by removing tokens from storage
  logger.info('User logged out', { action: 'LOGOUT' });
  
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

