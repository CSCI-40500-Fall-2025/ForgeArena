// Shared game logic for both environments
const { getUser, updateUser, updateRaidBoss, addActivity } = require('./state');

const processWorkout = async (exercise, reps) => {
  const user = await getUser();
  const xpGained = reps * 2;
  
  // Update user XP
  user.avatar.xp += xpGained;
  
  // Level up logic
  let leveledUp = false;
  while (user.avatar.xp >= user.avatar.level * 100) {
    user.avatar.xp -= user.avatar.level * 100;
    user.avatar.level++;
    user.avatar.strength += 2;
    user.avatar.endurance += 2;
    user.avatar.agility += 1;
    leveledUp = true;
  }
  
  // Update workout streak and last workout
  user.lastWorkout = new Date().toISOString().split('T')[0];
  
  // Update user in database
  await updateUser(user);
  
  // Update raid boss if squats
  let raidDamage = 0;
  if (exercise === 'squat') {
    raidDamage = reps;
    const raidBoss = await updateRaidBoss({
      currentHP: Math.max(0, (await updateRaidBoss()).currentHP - reps)
    });
    
    // Add activity for raid damage
    await addActivity({
      user: user.username,
      action: `dealt ${reps} damage to The Titan Squat`
    });
  }
  
  // Add level up activity if applicable
  if (leveledUp) {
    await addActivity({
      user: user.username,
      action: `leveled up to level ${user.avatar.level}`
    });
  }
  
  return { 
    message: `Great ${exercise} session!`, 
    xpGained, 
    newLevel: user.avatar.level,
    avatar: user.avatar,
    raidDamage
  };
};

const getLeaderboard = async () => {
  const user = await getUser();
  return [
    { username: 'GymHero99', level: 15, xp: 2340 },
    { username: 'FitWarrior', level: 12, xp: 1890 },
    { username: user.username, level: user.avatar.level, xp: user.avatar.xp },
    { username: 'StrengthMaster', level: 8, xp: 1200 },
    { username: 'CardioQueen', level: 7, xp: 980 }
  ].sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp));
};

const getInventory = async () => {
  const user = await getUser();
  const { mockEquipment } = require('./mockData');
  return user.avatar.inventory.map(itemId => ({
    id: itemId,
    ...mockEquipment[itemId]
  }));
};

module.exports = {
  processWorkout,
  getLeaderboard,
  getInventory
};
