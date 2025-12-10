/**
 * Route-Specific API Tests
 * Detailed tests for individual route modules
 */

const request = require('supertest');
const express = require('express');

// Mock authentication middleware
const mockAuthMiddleware = {
  authenticateToken: (req, res, next) => {
    req.user = {
      uid: 'test-user-id',
      username: 'testuser',
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
};

jest.mock('../middleware/auth.middleware', () => mockAuthMiddleware);

// ============================================================================
// ACHIEVEMENT ROUTES TESTS
// ============================================================================

describe('Achievement Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock achievement service
    jest.mock('../services/gameplay/achievement.service', () => ({
      getUserAchievements: jest.fn().mockResolvedValue([
        {
          id: 'first_workout',
          name: 'First Blood',
          unlocked: true,
          unlockedAt: '2024-01-01T00:00:00Z',
        },
      ]),
      getAchievementStats: jest.fn().mockResolvedValue({
        total: 20,
        unlocked: 5,
        percentage: 25,
      }),
      checkAndUnlockAchievements: jest.fn().mockResolvedValue([]),
      getAchievementProgress: jest.fn().mockResolvedValue([]),
    }));
    
    app = express();
    app.use(express.json());
    
    const achievementRoutes = require('../routes/achievement.routes');
    app.use('/api/achievements', achievementRoutes);
  });
  
  describe('GET /api/achievements', () => {
    it('should return achievements with stats', async () => {
      const response = await request(app)
        .get('/api/achievements')
        .expect(200);
      
      expect(response.body).toHaveProperty('achievements');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.achievements)).toBe(true);
    });
  });
  
  describe('GET /api/achievements/unlocked', () => {
    it('should return only unlocked achievements', async () => {
      const response = await request(app)
        .get('/api/achievements/unlocked')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('GET /api/achievements/stats', () => {
    it('should return achievement statistics', async () => {
      const response = await request(app)
        .get('/api/achievements/stats')
        .expect(200);
      
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unlocked');
      expect(response.body).toHaveProperty('percentage');
    });
  });
  
  describe('POST /api/achievements/check', () => {
    it('should check and unlock achievements', async () => {
      const response = await request(app)
        .post('/api/achievements/check')
        .expect(200);
      
      expect(response.body).toHaveProperty('newAchievements');
      expect(response.body).toHaveProperty('count');
    });
  });
});

// ============================================================================
// QUEST ROUTES TESTS
// ============================================================================

describe('Quest Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mock('../services/gameplay/quest.service', () => ({
      refreshQuests: jest.fn().mockResolvedValue([]),
      getUserQuests: jest.fn().mockResolvedValue([
        {
          id: 'daily_workout',
          title: 'Daily Dedication',
          type: 'daily',
          completed: false,
        },
      ]),
      getAvailableMilestoneQuests: jest.fn().mockResolvedValue([]),
      getAllUserQuests: jest.fn().mockResolvedValue([]),
      claimQuestReward: jest.fn().mockResolvedValue({
        xpReward: 50,
        quest: { title: 'Test Quest' },
      }),
    }));
    
    jest.mock('../services/user/user.service', () => ({
      updateUser: jest.fn().mockResolvedValue(true),
    }));
    
    jest.mock('../services/shared/activity.service', () => ({
      logQuestCompleteActivity: jest.fn().mockResolvedValue({}),
    }));
    
    app = express();
    app.use(express.json());
    
    const questRoutes = require('../routes/quest.routes');
    app.use('/api/quests', questRoutes);
  });
  
  describe('GET /api/quests', () => {
    it('should return user quests organized by type', async () => {
      const response = await request(app)
        .get('/api/quests')
        .expect(200);
      
      expect(response.body).toHaveProperty('daily');
      expect(response.body).toHaveProperty('weekly');
      expect(response.body).toHaveProperty('milestones');
    });
  });
  
  describe('GET /api/quests/all', () => {
    it('should return all quests including completed', async () => {
      const response = await request(app)
        .get('/api/quests/all')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

// ============================================================================
// DUEL ROUTES TESTS
// ============================================================================

describe('Duel Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mock('../services/gameplay/duel.service', () => ({
      getAvailableChallenges: jest.fn().mockReturnValue([
        { id: 'squats_24h', name: 'Most squats in 24h' },
      ]),
      getUserActiveDuels: jest.fn().mockResolvedValue([]),
      getPendingInvitations: jest.fn().mockResolvedValue([]),
      createDuel: jest.fn().mockResolvedValue({
        id: 'duel-123',
        status: 'pending',
      }),
      acceptDuel: jest.fn().mockResolvedValue({ status: 'active' }),
      declineDuel: jest.fn().mockResolvedValue({ message: 'Duel declined' }),
      getDuelStats: jest.fn().mockResolvedValue({
        total: 10,
        wins: 6,
        losses: 3,
        ties: 1,
      }),
    }));
    
    app = express();
    app.use(express.json());
    
    const duelRoutes = require('../routes/duel.routes');
    app.use('/api/duels', duelRoutes);
  });
  
  describe('GET /api/duels/challenges', () => {
    it('should return available duel challenges', async () => {
      const response = await request(app)
        .get('/api/duels/challenges')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('GET /api/duels/active', () => {
    it('should return active duels', async () => {
      const response = await request(app)
        .get('/api/duels/active')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('POST /api/duels', () => {
    it('should create a new duel challenge', async () => {
      const response = await request(app)
        .post('/api/duels')
        .send({
          opponentUsername: 'opponent',
          challengeType: 'squats_24h',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('duel');
    });
    
    it('should reject duel without opponent', async () => {
      const response = await request(app)
        .post('/api/duels')
        .send({
          challengeType: 'squats_24h',
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

// ============================================================================
// ACTIVITY ROUTES TESTS
// ============================================================================

describe('Activity Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mock('../services/shared/activity.service', () => ({
      getGlobalFeed: jest.fn().mockResolvedValue([
        {
          userId: 'user-1',
          username: 'testuser',
          type: 'workout',
          action: 'completed 20 push-ups',
        },
      ]),
      getUserFeed: jest.fn().mockResolvedValue([]),
      getActivitiesByType: jest.fn().mockResolvedValue([]),
    }));
    
    app = express();
    app.use(express.json());
    
    const activityRoutes = require('../routes/activity.routes');
    app.use('/api/activity', activityRoutes);
  });
  
  describe('GET /api/activity', () => {
    it('should return global activity feed', async () => {
      const response = await request(app)
        .get('/api/activity')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('GET /api/activity/user/:userId', () => {
    it('should return user-specific activity feed', async () => {
      const response = await request(app)
        .get('/api/activity/user/test-user-id')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

// ============================================================================
// LEADERBOARD ROUTES TESTS
// ============================================================================

describe('Leaderboard Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    jest.mock('../services/social/leaderboard.service', () => ({
      getLeaderboard: jest.fn().mockResolvedValue([
        {
          userId: 'user-1',
          username: 'topuser',
          level: 25,
          xp: 5000,
          rank: 1,
        },
      ]),
      getUserRank: jest.fn().mockResolvedValue({
        rank: 42,
        percentile: 75,
      }),
    }));
    
    app = express();
    app.use(express.json());
    
    const leaderboardRoutes = require('../routes/leaderboard.routes');
    app.use('/api/leaderboard', leaderboardRoutes);
  });
  
  describe('GET /api/leaderboard', () => {
    it('should return leaderboard data', async () => {
      const response = await request(app)
        .get('/api/leaderboard')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('GET /api/leaderboard/rank', () => {
    it('should return user rank', async () => {
      const response = await request(app)
        .get('/api/leaderboard/rank')
        .expect(200);
      
      expect(response.body).toHaveProperty('rank');
    });
  });
});

module.exports = {
  mockAuthMiddleware,
};

