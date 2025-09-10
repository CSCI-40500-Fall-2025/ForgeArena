let mockRaidBoss = {
  name: 'The Titan Squat',
  description: 'Defeat with collective squats!',
  totalHP: 10000,
  currentHP: 8500,
  participants: 47
};

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
    res.status(200).json(mockRaidBoss);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
