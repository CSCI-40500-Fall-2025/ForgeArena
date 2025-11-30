const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const authUtils = require('../utils/auth.utils');

// Path to users database file
const USERS_DB_PATH = path.join(__dirname, '../data/users.json');
const DATA_DIR = path.join(__dirname, '../data');

/**
 * Initialize the users database file
 */
async function initUsersDb() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Check if users file exists
    try {
      await fs.access(USERS_DB_PATH);
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(USERS_DB_PATH, JSON.stringify({ users: [] }, null, 2));
      logger.info('Users database initialized');
    }
  } catch (error) {
    logger.error('Failed to initialize users database', { error: error.message });
    throw error;
  }
}

/**
 * Read all users from database
 * @returns {Promise<Array>} Array of users
 */
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_DB_PATH, 'utf8');
    return JSON.parse(data).users || [];
  } catch (error) {
    logger.error('Failed to read users', { error: error.message });
    return [];
  }
}

/**
 * Write users to database
 * @param {Array} users - Array of users
 */
async function writeUsers(users) {
  try {
    await fs.writeFile(USERS_DB_PATH, JSON.stringify({ users }, null, 2));
  } catch (error) {
    logger.error('Failed to write users', { error: error.message });
    throw error;
  }
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object or null
 */
async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Find user by uid
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} User object or null
 */
async function findUserByUid(uid) {
  const users = await readUsers();
  return users.find(u => u.uid === uid) || null;
}

/**
 * Find user by handle
 * @param {string} handle - User handle
 * @returns {Promise<object|null>} User object or null
 */
async function findUserByHandle(handle) {
  const users = await readUsers();
  return users.find(u => u.handle.toLowerCase() === handle.toLowerCase()) || null;
}

/**
 * Check if handle is available
 * @param {string} handle - Handle to check
 * @returns {Promise<boolean>} True if available
 */
async function isHandleAvailable(handle) {
  const user = await findUserByHandle(handle);
  return user === null;
}

/**
 * Create a new user
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user (without password)
 */
async function createUser(userData) {
  const users = await readUsers();
  
  // Check if email already exists
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }
  
  // Generate unique handle
  const handle = await authUtils.generateUniqueHandle(userData.username, isHandleAvailable);
  
  // Create user object
  const newUser = {
    uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email,
    password: await authUtils.hashPassword(userData.password),
    username: userData.username,
    handle,
    avatarUrl: '',
    level: 1,
    xp: 0,
    strength: 10,
    endurance: 10,
    agility: 10,
    gym: '',
    workoutStreak: 0,
    lastWorkout: null,
    equipment: {},
    inventory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  await writeUsers(users);
  
  logger.info('User created successfully', {
    uid: newUser.uid,
    email: newUser.email,
    username: newUser.username,
    handle: newUser.handle,
  });
  
  // Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user (without password)
 */
async function updateUser(uid, updates) {
  const users = await readUsers();
  const userIndex = users.findIndex(u => u.uid === uid);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Don't allow updating sensitive fields
  const allowedFields = [
    'username', 'handle', 'avatarUrl', 'level', 'xp',
    'strength', 'endurance', 'agility', 'gym',
    'workoutStreak', 'lastWorkout', 'equipment', 'inventory'
  ];
  
  const filteredUpdates = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  
  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...filteredUpdates,
    updatedAt: new Date().toISOString(),
  };
  
  await writeUsers(users);
  
  logger.info('User updated successfully', { uid, updates: Object.keys(filteredUpdates) });
  
  // Return user without password
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

/**
 * Verify user credentials
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<object>} User object (without password) if valid
 */
async function verifyCredentials(email, password) {
  const user = await findUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValid = await authUtils.comparePassword(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

module.exports = {
  initUsersDb,
  findUserByEmail,
  findUserByUid,
  findUserByHandle,
  isHandleAvailable,
  createUser,
  updateUser,
  verifyCredentials,
};

