const path = require('path');

function reloadModules() {
	jest.resetModules();
	delete require.cache[require.resolve(path.join(__dirname, '..', 'mockData.js'))];
	return {
		gameLogic: require(path.join('..', 'gameLogic')),
		mockData: require(path.join('..', 'mockData')),
	};
}

describe('gameLogic exports', () => {
	it('exports all required functions', () => {
		const { gameLogic } = reloadModules();
		
		expect(typeof gameLogic.processWorkout).toBe('function');
		expect(typeof gameLogic.getXPForLevel).toBe('function');
		expect(typeof gameLogic.getLevelFromXP).toBe('function');
		expect(typeof gameLogic.getLevelProgress).toBe('function');
		expect(typeof gameLogic.calculatePlayerPower).toBe('function');
		expect(typeof gameLogic.getExerciseSuggestions).toBe('function');
		expect(typeof gameLogic.calculateRaidDamage).toBe('function');
		expect(typeof gameLogic.validateWorkout).toBe('function');
		expect(typeof gameLogic.formatExerciseName).toBe('function');
	});

	it('exports exercise multipliers', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.EXERCISE_MULTIPLIERS).toBeDefined();
		expect(gameLogic.EXERCISE_MULTIPLIERS.squat).toBe(2.0);
		expect(gameLogic.EXERCISE_MULTIPLIERS.pushup).toBe(1.5);
		expect(gameLogic.EXERCISE_MULTIPLIERS.pullup).toBe(2.5);
	});

	it('exports exercise stats', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.EXERCISE_STATS).toBeDefined();
		expect(gameLogic.EXERCISE_STATS.squat).toHaveProperty('strength');
		expect(gameLogic.EXERCISE_STATS.run).toHaveProperty('endurance');
	});
});

describe('gameLogic.calculatePlayerPower', () => {
	it('calculates power from user stats', () => {
		const { gameLogic } = reloadModules();
		
		const user = {
			level: 5,
			strength: 20,
			endurance: 15,
			agility: 10,
			equipment: {},
		};
		
		const power = gameLogic.calculatePlayerPower(user);
		
		expect(power).toBeGreaterThan(0);
		// Base power from stats = 20 + 15 + 10 = 45
		// Level multiplier = 1 + (5 * 0.1) = 1.5
		// Power should be around 45 * 1.5 = 67.5
		expect(power).toBeGreaterThanOrEqual(45);
	});

	it('returns 0 for null user', () => {
		const { gameLogic } = reloadModules();
		
		const power = gameLogic.calculatePlayerPower(null);
		expect(power).toBe(0);
	});

	it('adds equipment bonus', () => {
		const { gameLogic } = reloadModules();
		
		const userNoEquip = {
			level: 1,
			strength: 10,
			endurance: 10,
			agility: 10,
			equipment: {},
		};
		
		const userWithEquip = {
			level: 1,
			strength: 10,
			endurance: 10,
			agility: 10,
			equipment: { weapon: 'sword', armor: 'plate' },
		};
		
		const powerNoEquip = gameLogic.calculatePlayerPower(userNoEquip);
		const powerWithEquip = gameLogic.calculatePlayerPower(userWithEquip);
		
		expect(powerWithEquip).toBeGreaterThan(powerNoEquip);
	});
});

describe('gameLogic.formatExerciseName', () => {
	it('formats exercise names for display', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.formatExerciseName('squat')).toBe('squat');
		expect(gameLogic.formatExerciseName('pushup')).toBe('push-up');
		expect(gameLogic.formatExerciseName('pullup')).toBe('pull-up');
		expect(gameLogic.formatExerciseName('run')).toBe('running');
	});

	it('returns original name for unknown exercises', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.formatExerciseName('yoga')).toBe('yoga');
	});
});

describe('gameLogic.getXPForLevel', () => {
	it('returns correct XP threshold', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.getXPForLevel(1)).toBe(100);
		expect(gameLogic.getXPForLevel(5)).toBe(500);
		expect(gameLogic.getXPForLevel(10)).toBe(1000);
	});
});

describe('gameLogic.getLevelFromXP', () => {
	it('calculates level from total XP', () => {
		const { gameLogic } = reloadModules();
		
		expect(gameLogic.getLevelFromXP(0)).toBe(1);
		expect(gameLogic.getLevelFromXP(99)).toBe(1);
		expect(gameLogic.getLevelFromXP(100)).toBe(2);
		expect(gameLogic.getLevelFromXP(250)).toBe(3);
		expect(gameLogic.getLevelFromXP(1000)).toBe(11);
	});
});
