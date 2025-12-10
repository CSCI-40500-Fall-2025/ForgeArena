/**
 * Service Layer Tests
 * Tests for core business logic services
 */

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  apps: [{ name: 'test-app' }],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: 'test-uid', username: 'testuser' }),
        }),
        set: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: false,
              data: () => ({}),
            }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          })),
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
          })),
          get: jest.fn().mockResolvedValue({ docs: [] }),
        })),
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ empty: false, docs: [] }),
        })),
        get: jest.fn().mockResolvedValue({ empty: false, docs: [] }),
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          })),
          get: jest.fn().mockResolvedValue({ docs: [] }),
        })),
      })),
      get: jest.fn().mockResolvedValue({ docs: [] }),
    })),
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n) => n),
    arrayUnion: jest.fn((item) => [item]),
  },
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ============================================================================
// ACHIEVEMENT SERVICE TESTS
// ============================================================================

describe('Achievement Service', () => {
  let achievementService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    achievementService = require('../services/gameplay/achievement.service');
  });
  
  describe('checkAndUnlockAchievements', () => {
    it('should unlock first workout achievement', async () => {
      const userStats = {
        totalWorkouts: 1,
        lifetimeReps: 20,
        workoutStreak: 1,
        level: 1,
      };
      
      const newAchievements = await achievementService.checkAndUnlockAchievements(
        'test-user-id',
        userStats
      );
      
      expect(Array.isArray(newAchievements)).toBe(true);
    });
    
    it('should not unlock achievements below threshold', async () => {
      const userStats = {
        totalWorkouts: 0,
        lifetimeReps: 0,
        workoutStreak: 0,
        level: 1,
      };
      
      const newAchievements = await achievementService.checkAndUnlockAchievements(
        'test-user-id',
        userStats
      );
      
      expect(Array.isArray(newAchievements)).toBe(true);
    });
  });
  
  describe('processWorkoutForAchievements', () => {
    it('should process workout and return achievements', async () => {
      const userStats = {
        totalWorkouts: 50,
        lifetimeReps: 1000,
        level: 10,
      };
      
      const result = await achievementService.processWorkoutForAchievements(
        'test-user-id',
        userStats
      );
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

// ============================================================================
// QUEST SERVICE TESTS
// ============================================================================

describe('Quest Service', () => {
  let questService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    questService = require('../services/gameplay/quest.service');
  });
  
  describe('processWorkoutForQuests', () => {
    it('should process workout and update quest progress', async () => {
      const workoutData = {
        exercise: 'pushup',
        reps: 20,
      };
      
      const updates = await questService.processWorkoutForQuests(
        'test-user-id',
        workoutData
      );
      
      expect(Array.isArray(updates)).toBe(true);
    });
  });
  
  describe('generateDailyQuests', () => {
    it('should generate 3 daily quests', async () => {
      const user = {
        uid: 'test-user-id',
        level: 5,
      };
      
      const quests = await questService.generateDailyQuests(user);
      
      expect(Array.isArray(quests)).toBe(true);
      expect(quests.length).toBeLessThanOrEqual(3);
    });
  });
});

// ============================================================================
// DUEL SERVICE TESTS
// ============================================================================

describe('Duel Service', () => {
  let duelService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    duelService = require('../services/gameplay/duel.service');
  });
  
  describe('getAvailableChallenges', () => {
    it('should return list of duel challenges', () => {
      const challenges = duelService.getAvailableChallenges();
      
      expect(Array.isArray(challenges)).toBe(true);
      expect(challenges.length).toBeGreaterThan(0);
      expect(challenges[0]).toHaveProperty('id');
      expect(challenges[0]).toHaveProperty('name');
    });
  });
  
  describe('processWorkoutForDuels', () => {
    it('should process workout for active duels', async () => {
      const workoutData = {
        exercise: 'squat',
        reps: 30,
      };
      
      const updates = await duelService.processWorkoutForDuels(
        'test-user-id',
        workoutData
      );
      
      expect(Array.isArray(updates)).toBe(true);
    });
  });
});

// ============================================================================
// RAID SERVICE TESTS
// ============================================================================

describe('Raid Service', () => {
  let raidService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    raidService = require('../services/gameplay/raid.service');
  });
  
  describe('getAvailableBosses', () => {
    it('should return list of raid bosses', () => {
      const bosses = raidService.getAvailableBosses(4);
      
      expect(Array.isArray(bosses)).toBe(true);
      expect(bosses.length).toBeGreaterThan(0);
      expect(bosses[0]).toHaveProperty('id');
      expect(bosses[0]).toHaveProperty('name');
      expect(bosses[0]).toHaveProperty('scaledHp');
    });
  });
  
  describe('calculateWorkoutDamage', () => {
    it('should calculate damage from workout', () => {
      const damage = raidService.calculateWorkoutDamage('pushup', 20, 5);
      
      expect(typeof damage).toBe('number');
      expect(damage).toBeGreaterThan(0);
    });
    
    it('should scale damage with user level', () => {
      const damage1 = raidService.calculateWorkoutDamage('pushup', 20, 1);
      const damage2 = raidService.calculateWorkoutDamage('pushup', 20, 10);
      
      expect(damage2).toBeGreaterThan(damage1);
    });
  });
  
  describe('calculateScaledHp', () => {
    it('should scale boss HP based on party size', () => {
      const boss = {
        baseHp: 1000,
        hpPerMember: 500,
      };
      
      const hp1 = raidService.calculateScaledHp(boss, 1);
      const hp4 = raidService.calculateScaledHp(boss, 4);
      
      expect(hp4).toBeGreaterThan(hp1);
      expect(hp1).toBe(1500); // 1000 + 500*1
      expect(hp4).toBe(3000); // 1000 + 500*4
    });
  });
});

// ============================================================================
// ACTIVITY SERVICE TESTS
// ============================================================================

describe('Activity Service', () => {
  let activityService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    activityService = require('../services/shared/activity.service');
  });
  
  describe('logWorkoutActivity', () => {
    it('should log workout activity', async () => {
      const result = await activityService.logWorkoutActivity(
        'test-user-id',
        'testuser',
        'pushup',
        20
      );
      
      expect(result).toBeDefined();
    });
  });
  
  describe('logLevelUpActivity', () => {
    it('should log level up activity', async () => {
      const result = await activityService.logLevelUpActivity(
        'test-user-id',
        'testuser',
        10
      );
      
      expect(result).toBeDefined();
    });
  });
  
  describe('logStreakMilestoneActivity', () => {
    it('should log streak milestone for valid milestones', async () => {
      const result = await activityService.logStreakMilestoneActivity(
        'test-user-id',
        'testuser',
        7
      );
      
      expect(result).toBeDefined();
    });
    
    it('should not log for non-milestone streaks', async () => {
      const result = await activityService.logStreakMilestoneActivity(
        'test-user-id',
        'testuser',
        5 // Not a milestone
      );
      
      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// ITEM SERVICE TESTS
// ============================================================================

describe('Item Service', () => {
  let itemService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    itemService = require('../services/shared/item.service');
  });
  
  describe('getUserInventory', () => {
    it('should return user inventory', () => {
      const inventory = itemService.getUserInventory('test-user-id');
      
      expect(Array.isArray(inventory)).toBe(true);
    });
  });
  
  describe('equipItem', () => {
    it('should equip an item from inventory', () => {
      const userId = 'test-user-id';
      const inventory = itemService.getUserInventory(userId);
      
      if (inventory.length > 0) {
        const itemId = inventory[0].id;
        const result = itemService.equipItem(userId, itemId);
        
        expect(result).toHaveProperty('equipped');
        expect(result).toHaveProperty('equipment');
        expect(result).toHaveProperty('stats');
      }
    });
  });
});

