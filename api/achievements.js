let mockAchievements = [
  { id: 1, name: 'First Blood', description: 'Complete your first workout', unlocked: true, icon: '🏆' },
  { id: 2, name: 'Level Up!', description: 'Reach level 2', unlocked: false, icon: '⬆️' },
  { id: 3, name: 'Streak Warrior', description: 'Maintain a 5-day streak', unlocked: false, icon: '🔥' },
  { id: 4, name: 'Boss Slayer', description: 'Deal 1000 damage to raid boss', unlocked: false, icon: '⚔️' },
  { id: 5, name: 'Gym Legend', description: 'Reach top 3 on leaderboard', unlocked: false, icon: '👑' }
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(mockAchievements);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
