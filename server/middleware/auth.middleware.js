const authUtils = require('../utils/auth.utils');
const userService = require('../services/user.service');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT access token
 * Attaches user object to req.user if token is valid
 */
async function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      logger.warn('No token provided', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify token
    const decoded = authUtils.verifyAccessToken(token);
    
    if (!decoded) {
      logger.warn('Invalid or expired token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await userService.findUserByUid(decoded.uid);
    
    if (!user) {
      logger.warn('User not found for token', {
        uid: decoded.uid,
        path: req.path,
      });
      return res.status(403).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    
    logger.debug('User authenticated', {
      uid: user.uid,
      email: user.email,
      path: req.path,
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      path: req.path,
      method: req.method,
    });
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = authUtils.verifyAccessToken(token);
      
      if (decoded) {
        const user = await userService.findUserByUid(decoded.uid);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on error, just continue without user
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
};

