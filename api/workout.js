const { mockUser, mockRaidBoss } = require('../shared/mockData');

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { exercise, reps } = req.body;
    const xpGained = reps * 2;
    
    // Update user XP
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
    
    res.status(200).json({ 
      message: `Great ${exercise} session!`, 
      xpGained, 
      newLevel: mockUser.avatar.level,
      avatar: mockUser.avatar 
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
