let mockActivityFeed = [
  { id: 1, user: 'GymHero99', action: 'leveled up to level 16', timestamp: new Date(Date.now() - 30*60*1000) },
  { id: 2, user: 'FitWarrior', action: 'completed quest "Cardio Warrior"', timestamp: new Date(Date.now() - 45*60*1000) },
  { id: 3, user: 'StrengthMaster', action: 'dealt 250 damage to The Titan Squat', timestamp: new Date(Date.now() - 60*60*1000) },
  { id: 4, user: 'TestWarrior', action: 'started a 3-day workout streak', timestamp: new Date(Date.now() - 2*60*60*1000) }
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
    res.status(200).json(mockActivityFeed);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
