const path = require('path');

function reloadModules() {
	jest.resetModules();
	delete require.cache[require.resolve(path.join(__dirname, '..', 'mockData.js'))];
	return {
		gameLogic: require(path.join('..', 'gameLogic')),
		mockData: require(path.join('..', 'mockData')),
	};
}

describe('gameLogic.getInventory', () => {
	it('maps inventory item IDs to detailed objects', () => {
		const { gameLogic, mockData } = reloadModules();
		mockData.mockUser.avatar.inventory = ['basic_gloves', 'water_bottle'];
		const inventory = gameLogic.getInventory();
		expect(Array.isArray(inventory)).toBe(true);
		expect(inventory).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'basic_gloves', name: 'Basic Gloves' }),
				expect.objectContaining({ id: 'water_bottle', name: 'Water Bottle' }),
			])
		);
	});
});


