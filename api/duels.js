const { mockDuels } = require('../shared/mockData');

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
    res.status(200).json(mockDuels);
  } else if (req.method === 'POST') {
    // Handle duel creation
    const { opponent, challenge } = req.body;
    const newDuel = {
      id: mockDuels.length + 1,
      challenger: 'TestWarrior',
      opponent,
      status: 'pending',
      challenge,
      deadline: new Date(Date.now() + 24*60*60*1000)
    };
    mockDuels.push(newDuel);
    res.status(200).json({ message: `Challenge sent to ${opponent}!` });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
