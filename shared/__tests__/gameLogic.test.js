const path = require('path');

// Helper to reset modules so mock state is fresh per test
function reloadModules() {
	jest.resetModules();
	const mockDataPath = path.join('..', 'mockData');
	delete require.cache[require.resolve(path.join(__dirname, '..', 'mockData.js'))];
	return {
		gameLogic: require(path.join('..', 'gameLogic')),
		mockData: require(path.join('..', 'mockData')),
	};
}

describe('gameLogic.processWorkout', () => {
	it('increments XP and levels up appropriately', () => {
		const { gameLogic, mockData } = reloadModules();
		// Start from level 1, xp 0
		expect(mockData.mockUser.avatar.level).toBe(1);
		expect(mockData.mockUser.avatar.xp).toBe(0);

		const result = gameLogic.processWorkout('pushup', 60); // 120 XP

		expect(result.xpGained).toBe(120);
		expect(mockData.mockUser.avatar.level).toBe(2); // leveled once (threshold 100)
		// Remaining XP = 20 after level up
		expect(mockData.mockUser.avatar.xp).toBe(20);
		// Stats increased on level up
		expect(mockData.mockUser.avatar.strength).toBe(12);
		expect(mockData.mockUser.avatar.endurance).toBe(12);
		expect(mockData.mockUser.avatar.agility).toBe(11);
	});

	it('reduces raid boss HP when exercise is squat', () => {
		const { gameLogic, mockData } = reloadModules();
		const initialHp = mockData.mockRaidBoss.currentHP;
		gameLogic.processWorkout('squat', 50);
		expect(mockData.mockRaidBoss.currentHP).toBe(Math.max(0, initialHp - 50));
	});
});

describe('gameLogic.getLeaderboard', () => {
	it('returns users sorted by level and xp descending', () => {
		const { gameLogic } = reloadModules();
		const leaderboard = gameLogic.getLeaderboard();
		for (let i = 1; i < leaderboard.length; i++) {
			const prevScore = leaderboard[i - 1].level * 1000 + leaderboard[i - 1].xp;
			const curScore = leaderboard[i].level * 1000 + leaderboard[i].xp;
			expect(prevScore).toBeGreaterThanOrEqual(curScore);
		}
	});
});


