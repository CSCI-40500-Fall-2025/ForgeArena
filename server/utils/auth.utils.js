const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/auth.config');
const logger = require('./logger');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate an access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
}

/**
 * Generate a refresh token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiration,
  });
}

/**
 * Verify an access token
 * @param {string} token - JWT access token
 * @returns {object|null} Decoded token payload or null if invalid
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    logger.warn('Access token verification failed', { error: error.message });
    return null;
  }
}

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token
 * @returns {object|null} Decoded token payload or null if invalid
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    logger.warn('Refresh token verification failed', { error: error.message });
    return null;
  }
}

/**
 * Generate a unique handle from username
 * @param {string} username - Base username
 * @param {Function} checkAvailability - Function to check if handle is available
 * @returns {Promise<string>} Unique handle
 */
async function generateUniqueHandle(username, checkAvailability) {
  let handle = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  let counter = 0;
  let originalHandle = handle;
  
  while (!(await checkAvailability(handle))) {
    counter++;
    handle = `${originalHandle}${counter}`;
  }
  
  return handle;
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password
 * @returns {object} {valid: boolean, message: string}
 */
function validatePassword(password) {
  if (!password || password.length < config.passwordMinLength) {
    return {
      valid: false,
      message: `Password must be at least ${config.passwordMinLength} characters long`,
    };
  }
  
  return { valid: true, message: 'Password is valid' };
}

/**
 * Validate username
 * @param {string} username - Username
 * @returns {object} {valid: boolean, message: string}
 */
function validateUsername(username) {
  if (!username || username.length < config.usernameMinLength) {
    return {
      valid: false,
      message: `Username must be at least ${config.usernameMinLength} characters long`,
    };
  }
  
  if (username.length > config.usernameMaxLength) {
    return {
      valid: false,
      message: `Username must not exceed ${config.usernameMaxLength} characters`,
    };
  }
  
  return { valid: true, message: 'Username is valid' };
}

/**
 * Validate handle format
 * @param {string} handle - Handle
 * @returns {object} {valid: boolean, message: string}
 */
function validateHandle(handle) {
  const handleRegex = /^[a-z0-9]{3,20}$/;
  
  if (!handleRegex.test(handle)) {
    return {
      valid: false,
      message: 'Handle must be 3-20 characters, lowercase letters and numbers only',
    };
  }
  
  return { valid: true, message: 'Handle is valid' };
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateUniqueHandle,
  validateEmail,
  validatePassword,
  validateUsername,
  validateHandle,
};

