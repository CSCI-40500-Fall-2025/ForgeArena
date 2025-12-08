const { getUser, updateUser, updateRaidBoss } = require('../../shared/database/firebase');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { exercise, reps } = req.body;
      const user = await getUser();
      const xpGained = reps * 2;
      
      // Update user XP
      user.avatar.xp += xpGained;
      
      // Level up logic
      while (user.avatar.xp >= user.avatar.level * 100) {
        user.avatar.xp -= user.avatar.level * 100;
        user.avatar.level++;
        user.avatar.strength += 2;
        user.avatar.endurance += 2;
        user.avatar.agility += 1;
      }
      
      // Update user in database
      await updateUser(user);
      
      // Update raid boss if squats
      if (exercise === 'squat') {
        const currentRaidBoss = await getRaidBoss();
        await updateRaidBoss({
          currentHP: Math.max(0, currentRaidBoss.currentHP - reps)
        });
      }
      
      res.status(200).json({ 
        message: `Great ${exercise} session!`, 
        xpGained, 
        newLevel: user.avatar.level,
        avatar: user.avatar 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
