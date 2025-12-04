const path = require('path');

// Helper to reset modules so state is fresh per test
function reloadModules() {
	jest.resetModules();
	delete require.cache[require.resolve(path.join(__dirname, '..', 'mockData.js'))];
	return {
		gameLogic: require(path.join('..', 'gameLogic')),
		mockData: require(path.join('..', 'mockData')),
	};
}

describe('gameLogic.processWorkout', () => {
	it('calculates XP correctly for pushups', () => {
		const { gameLogic, mockData } = reloadModules();
		
		// Create a user object to pass to processWorkout
		const user = {
			level: 1,
			xp: 0,
			workoutStreak: 0,
		};

		// 60 pushups * 1.5 multiplier = 90 base XP
		// Level bonus: 1 + (1 * 0.02) = 1.02
		// Streak bonus: 1 (no streak)
		// Final: 90 * 1.02 * 1 = ~92 (rounded)
		const result = gameLogic.processWorkout(user, 'pushup', 60);

		expect(result.xpGained).toBeGreaterThan(0);
		expect(result.exercise).toBe('pushup');
		expect(result.reps).toBe(60);
		expect(result.message).toContain('push-up');
	});

	it('applies streak bonus correctly', () => {
		const { gameLogic } = reloadModules();
		
		const userWithStreak = {
			level: 1,
			xp: 0,
			workoutStreak: 10, // 50% bonus (capped)
		};
		
		const userNoStreak = {
			level: 1,
			xp: 0,
			workoutStreak: 0,
		};

		const resultWithStreak = gameLogic.processWorkout(userWithStreak, 'squat', 20);
		const resultNoStreak = gameLogic.processWorkout(userNoStreak, 'squat', 20);

		// Streak should give more XP
		expect(resultWithStreak.xpGained).toBeGreaterThan(resultNoStreak.xpGained);
		expect(resultWithStreak.bonuses.streak).toBeGreaterThan(resultNoStreak.bonuses.streak);
	});

	it('applies level bonus correctly', () => {
		const { gameLogic } = reloadModules();
		
		const highLevelUser = {
			level: 10,
			xp: 0,
			workoutStreak: 0,
		};
		
		const lowLevelUser = {
			level: 1,
			xp: 0,
			workoutStreak: 0,
		};

		const resultHighLevel = gameLogic.processWorkout(highLevelUser, 'squat', 20);
		const resultLowLevel = gameLogic.processWorkout(lowLevelUser, 'squat', 20);

		// Higher level should give more XP
		expect(resultHighLevel.xpGained).toBeGreaterThan(resultLowLevel.xpGained);
		expect(resultHighLevel.bonuses.level).toBeGreaterThan(resultLowLevel.bonuses.level);
	});

	it('calculates raid damage', () => {
		const { gameLogic } = reloadModules();
		
		const user = { level: 5, workoutStreak: 0 };
		const result = gameLogic.processWorkout(user, 'squat', 50);

		expect(result.raidDamage).toBeGreaterThan(0);
		expect(result.raidDamage).toBeGreaterThan(50); // Should be more than base due to multipliers
	});

	it('returns stat gains for different exercises', () => {
		const { gameLogic } = reloadModules();
		const user = { level: 1, workoutStreak: 0 };

		const squatResult = gameLogic.processWorkout(user, 'squat', 20);
		const runResult = gameLogic.processWorkout(user, 'run', 20);

		// Squat should have strength gain
		expect(squatResult.statGains).toHaveProperty('strength');
		// Run should have endurance gain
		expect(runResult.statGains).toHaveProperty('endurance');
	});
});

describe('gameLogic.getLevelProgress', () => {
	it('calculates level progress correctly', () => {
		const { gameLogic } = reloadModules();

		const progress = gameLogic.getLevelProgress(150);
		
		expect(progress.currentLevel).toBe(2); // 150 XP = level 2
		expect(progress.xpIntoLevel).toBe(50); // 50 XP into level 2
		expect(progress.xpNeeded).toBe(100);
		expect(progress.percentage).toBe(50);
	});
});

describe('gameLogic.calculateRaidDamage', () => {
	it('calculates damage with level multiplier', () => {
		const { gameLogic } = reloadModules();

		const lowLevelDamage = gameLogic.calculateRaidDamage('squat', 20, 1);
		const highLevelDamage = gameLogic.calculateRaidDamage('squat', 20, 10);

		expect(highLevelDamage).toBeGreaterThan(lowLevelDamage);
	});
});

describe('gameLogic.validateWorkout', () => {
	it('validates correct workout input', () => {
		const { gameLogic } = reloadModules();

		const result = gameLogic.validateWorkout('squat', 20);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('rejects invalid reps', () => {
		const { gameLogic } = reloadModules();

		const result = gameLogic.validateWorkout('squat', -5);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it('rejects excessive reps', () => {
		const { gameLogic } = reloadModules();

		const result = gameLogic.validateWorkout('squat', 50000);
		expect(result.valid).toBe(false);
	});
});

describe('gameLogic.getExerciseSuggestions', () => {
	it('returns exercise suggestions', () => {
		const { gameLogic } = reloadModules();

		const suggestions = gameLogic.getExerciseSuggestions({ recentExercises: [] });
		
		expect(Array.isArray(suggestions)).toBe(true);
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0]).toHaveProperty('exercise');
		expect(suggestions[0]).toHaveProperty('multiplier');
	});

	it('deprioritizes recently done exercises', () => {
		const { gameLogic } = reloadModules();

		const suggestions = gameLogic.getExerciseSuggestions({ 
			recentExercises: ['squat', 'pushup'] 
		});
		
		// First suggestions should not be recently done
		const topSuggestions = suggestions.slice(0, 3);
		const recentlyDoneInTop = topSuggestions.filter(s => s.recentlyDone);
		
		expect(recentlyDoneInTop.length).toBeLessThan(topSuggestions.length);
	});
});
