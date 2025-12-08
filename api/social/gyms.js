const { mockGyms, mockUser } = require('../../shared/database/mockData');

module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json(mockGyms);
  } else if (req.method === 'POST') {
    // Handle gym joining - expect { gymId } in body
    const { gymId } = req.body;
    const gym = mockGyms.find(g => g.id == gymId);
    
    if (gym) {
      mockUser.gym = gym.name;
      res.status(200).json({ message: `Successfully joined ${gym.name}!` });
    } else {
      res.status(404).json({ message: 'Gym not found' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
