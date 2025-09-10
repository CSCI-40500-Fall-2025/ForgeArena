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
    const gyms = [
      { id: 1, name: 'PowerHouse Fitness', members: 47, location: 'Downtown' },
      { id: 2, name: 'Iron Paradise', members: 32, location: 'Uptown' },
      { id: 3, name: 'Flex Zone', members: 28, location: 'Suburbs' },
      { id: 4, name: 'Beast Mode Gym', members: 19, location: 'East Side' }
    ];
    res.status(200).json(gyms);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
