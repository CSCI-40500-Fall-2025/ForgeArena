// Shared game logic for both environments
const { getState, updateUser, updateRaidBoss, addActivity } = require('./state');

const processWorkout = (exercise, reps) => {
  const state = getState();
  const xpGained = reps * 2;
  
  // Update user XP
  state.user.avatar.xp += xpGained;
  
  // Level up logic
  let leveledUp = false;
  while (state.user.avatar.xp >= state.user.avatar.level * 100) {
    state.user.avatar.xp -= state.user.avatar.level * 100;
    state.user.avatar.level++;
    state.user.avatar.strength += 2;
    state.user.avatar.endurance += 2;
    state.user.avatar.agility += 1;
    leveledUp = true;
  }
  
  // Update workout streak and last workout
  state.user.lastWorkout = new Date().toISOString().split('T')[0];
  
  // Update raid boss if squats
  let raidDamage = 0;
  if (exercise === 'squat') {
    raidDamage = reps;
    state.raidBoss.currentHP = Math.max(0, state.raidBoss.currentHP - reps);
    
    // Add activity for raid damage
    addActivity({
      id: Date.now(),
      user: state.user.username,
      action: `dealt ${reps} damage to ${state.raidBoss.name}`,
      timestamp: new Date()
    });
  }
  
  // Add level up activity if applicable
  if (leveledUp) {
    addActivity({
      id: Date.now() + 1,
      user: state.user.username,
      action: `leveled up to level ${state.user.avatar.level}`,
      timestamp: new Date()
    });
  }
  
  return { 
    message: `Great ${exercise} session!`, 
    xpGained, 
    newLevel: state.user.avatar.level,
    avatar: state.user.avatar,
    raidDamage
  };
};

const getLeaderboard = () => {
  const state = getState();
  return [
    { username: 'GymHero99', level: 15, xp: 2340 },
    { username: 'FitWarrior', level: 12, xp: 1890 },
    { username: state.user.username, level: state.user.avatar.level, xp: state.user.avatar.xp },
    { username: 'StrengthMaster', level: 8, xp: 1200 },
    { username: 'CardioQueen', level: 7, xp: 980 }
  ].sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp));
};

const getInventory = () => {
  const state = getState();
  return state.user.avatar.inventory.map(itemId => ({
    id: itemId,
    ...state.equipment[itemId]
  }));
};

module.exports = {
  processWorkout,
  getLeaderboard,
  getInventory
};
