const { getState } = require('../shared/state');

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
    const gyms = [
      { id: 1, name: 'PowerHouse Fitness', members: 47, location: 'Downtown' },
      { id: 2, name: 'Iron Paradise', members: 32, location: 'Uptown' },
      { id: 3, name: 'Flex Zone', members: 28, location: 'Suburbs' },
      { id: 4, name: 'Beast Mode Gym', members: 19, location: 'East Side' }
    ];
    res.status(200).json(gyms);
  } else if (req.method === 'POST') {
    // Handle gym joining - expect { gymId } in body
    const { gymId } = req.body;
    const gymNames = {
      1: 'PowerHouse Fitness',
      2: 'Iron Paradise', 
      3: 'Flex Zone',
      4: 'Beast Mode Gym'
    };
    
    const gymName = gymNames[gymId];
    if (gymName) {
      const state = getState();
      state.user.gym = gymName;
      res.status(200).json({ message: `Joined ${gymName}!`, gym: gymName });
    } else {
      res.status(404).json({ message: 'Gym not found' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
