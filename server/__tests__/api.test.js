/**
 * API Integration Tests for ForgeArena
 * Tests all major API endpoints
 */

const request = require('supertest');
const app = require('../index');

// Mock Firebase Admin to avoid initialization errors in tests
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

// Mock services to avoid database dependencies
jest.mock('../services/user/user.service', () => ({
  initUsersDb: jest.fn().mockResolvedValue(true),
  findUserByUid: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    level: 5,
    xp: 250,
    totalWorkouts: 10,
    lifetimeReps: 500,
    workoutStreak: 3,
    lastWorkout: new Date().toISOString(),
  }),
  updateUser: jest.fn().mockResolvedValue(true),
  createUser: jest.fn().mockResolvedValue({
    uid: 'new-user-id',
    username: 'newuser',
    email: 'new@example.com',
  }),
}));

jest.mock('../services/gameplay/quest.service', () => ({
  processWorkoutForQuests: jest.fn().mockResolvedValue([]),
  getUserQuests: jest.fn().mockResolvedValue([]),
  refreshQuests: jest.fn().mockResolvedValue([]),
}));

jest.mock('../services/gameplay/achievement.service', () => ({
  processWorkoutForAchievements: jest.fn().mockResolvedValue([]),
  getUserAchievements: jest.fn().mockResolvedValue([]),
  getAchievementStats: jest.fn().mockResolvedValue({
    total: 20,
    unlocked: 5,
    percentage: 25,
  }),
}));

jest.mock('../services/gameplay/duel.service', () => ({
  processWorkoutForDuels: jest.fn().mockResolvedValue([]),
}));

jest.mock('../services/shared/activity.service', () => ({
  logWorkoutActivity: jest.fn().mockResolvedValue({}),
  logLevelUpActivity: jest.fn().mockResolvedValue({}),
  logStreakMilestoneActivity: jest.fn().mockResolvedValue({}),
  getGlobalFeed: jest.fn().mockResolvedValue([]),
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  http: jest.fn(),
}));

// Mock authentication middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      uid: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      level: 5,
      xp: 250,
      totalWorkouts: 10,
      lifetimeReps: 500,
      workoutStreak: 3,
    };
    next();
  },
  optionalAuth: (req, res, next) => {
    req.user = null;
    next();
  },
}));

describe('ForgeArena API Tests', () => {
  
  // ============================================================================
  // HEALTH & STATUS TESTS
  // ============================================================================
  
  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'forge-arena');
    });
  });
  
  // ============================================================================
  // USER PROFILE TESTS
  // ============================================================================
  
  describe('GET /api/user', () => {
    it('should return authenticated user profile', async () => {
      const response = await request(app)
        .get('/api/user')
        .expect(200);
      
      expect(response.body).toHaveProperty('uid', 'test-user-id');
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('level', 5);
    });
  });
  
  // ============================================================================
  // WORKOUT TESTS
  // ============================================================================
  
  describe('POST /api/workout', () => {
    it('should process a valid workout', async () => {
      const response = await request(app)
        .post('/api/workout')
        .send({
          exercise: 'pushup',
          reps: 20,
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('xpGained');
      expect(response.body).toHaveProperty('newLevel');
      expect(response.body).toHaveProperty('leveledUp');
      expect(response.body).toHaveProperty('message');
      expect(response.body.xpGained).toBeGreaterThan(0);
    });
    
    it('should reject workout with missing exercise', async () => {
      const response = await request(app)
        .post('/api/workout')
        .send({
          reps: 20,
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should reject workout with missing reps', async () => {
      const response = await request(app)
        .post('/api/workout')
        .send({
          exercise: 'pushup',
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should process different exercise types', async () => {
      const exercises = ['pushup', 'squat', 'pullup', 'plank'];
      
      for (const exercise of exercises) {
        const response = await request(app)
          .post('/api/workout')
          .send({
            exercise,
            reps: 15,
          })
          .expect(200);
        
        expect(response.body).toHaveProperty('exercise', exercise);
        expect(response.body).toHaveProperty('xpGained');
      }
    });
  });
  
  // ============================================================================
  // ACHIEVEMENT TESTS
  // ============================================================================
  
  describe('GET /api/achievements', () => {
    it('should return user achievements', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .expect(200);
      
      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('unlocked');
    });
  });
  
  describe('POST /api/achievements/check', () => {
    it('should check for new achievements', async () => {
      const response = await request(app)
        .post('/api/achievements/check')
        .expect(200);
      
      expect(response.body).toHaveProperty('newAchievements');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.newAchievements)).toBe(true);
    });
  });
  
  // ============================================================================
  // QUEST TESTS
  // ============================================================================
  
  describe('GET /api/quests', () => {
    it('should return user quests', async () => {
      const response = await request(app)
        .get('/api/quests')
        .expect(200);
      
      expect(response.body).toHaveProperty('daily');
      expect(response.body).toHaveProperty('weekly');
      expect(response.body).toHaveProperty('milestones');
      expect(Array.isArray(response.body.daily)).toBe(true);
    });
  });
  
  // ============================================================================
  // ACTIVITY FEED TESTS
  // ============================================================================
  
  describe('GET /api/activity', () => {
    it('should return global activity feed', async () => {
      const response = await request(app)
        .get('/api/activity')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  // ============================================================================
  // INVENTORY TESTS
  // ============================================================================
  
  describe('GET /api/inventory', () => {
    it('should return user inventory', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  // ============================================================================
  // RAID TESTS
  // ============================================================================
  
  describe('GET /api/raid', () => {
    it('should return raid boss information', async () => {
      const response = await request(app)
        .get('/api/raid')
        .expect(200);
      
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('totalHP');
      expect(response.body).toHaveProperty('difficulty');
    });
  });
  
  // ============================================================================
  // GYMS TESTS
  // ============================================================================
  
  describe('GET /api/gyms', () => {
    it('should return list of gyms', async () => {
      const response = await request(app)
        .get('/api/gyms')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  // ============================================================================
  // 404 TESTS
  // ============================================================================
  
  describe('GET /api/nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('message');
    });
  });
});

