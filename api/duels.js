let mockDuels = [
  { id: 1, challenger: 'TestWarrior', opponent: 'GymHero99', status: 'pending', challenge: 'Most squats in 24h', deadline: new Date(Date.now() + 24*60*60*1000) },
  { id: 2, challenger: 'FitWarrior', opponent: 'TestWarrior', status: 'active', challenge: 'Most push-ups in 1 hour', deadline: new Date(Date.now() + 60*60*1000) }
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
    res.status(200).json(mockDuels);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
