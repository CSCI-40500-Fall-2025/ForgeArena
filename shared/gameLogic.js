// Shared game logic for both environments
const { mockUser, mockRaidBoss } = require('./mockData');

const processWorkout = (exercise, reps) => {
  const xpGained = reps * 2;
  
  mockUser.avatar.xp += xpGained;
  
  // Level up logic
  while (mockUser.avatar.xp >= mockUser.avatar.level * 100) {
    mockUser.avatar.xp -= mockUser.avatar.level * 100;
    mockUser.avatar.level++;
    mockUser.avatar.strength += 2;
    mockUser.avatar.endurance += 2;
    mockUser.avatar.agility += 1;
  }
  
  // Update raid boss if squats
  if (exercise === 'squat') {
    mockRaidBoss.currentHP = Math.max(0, mockRaidBoss.currentHP - reps);
  }
  
  return { 
    message: `Great ${exercise} session!`, 
    xpGained, 
    newLevel: mockUser.avatar.level,
    avatar: mockUser.avatar 
  };
};

const getLeaderboard = () => {
  return [
    { username: 'GymHero99', level: 15, xp: 2340 },
    { username: 'FitWarrior', level: 12, xp: 1890 },
    { username: mockUser.username, level: mockUser.avatar.level, xp: mockUser.avatar.xp },
    { username: 'StrengthMaster', level: 8, xp: 1200 },
    { username: 'CardioQueen', level: 7, xp: 980 }
  ].sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp));
};

const getInventory = () => {
  const { mockEquipment } = require('./mockData');
  return mockUser.avatar.inventory.map(itemId => ({
    id: itemId,
    ...mockEquipment[itemId]
  }));
};

module.exports = {
  processWorkout,
  getLeaderboard,
  getInventory
};
