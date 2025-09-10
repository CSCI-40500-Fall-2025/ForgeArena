const { getState, addDuel } = require('../shared/state');

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
    const state = getState();
    res.status(200).json(state.duels);
  } else if (req.method === 'POST') {
    // Handle duel creation
    const { opponent, challenge } = req.body;
    const state = getState();
    const newDuel = {
      id: state.duels.length + 1,
      challenger: state.user.username,
      opponent,
      status: 'pending',
      challenge,
      deadline: new Date(Date.now() + 24*60*60*1000)
    };
    addDuel(newDuel);
    res.status(200).json({ message: `Duel challenge sent to ${opponent}!`, duel: newDuel });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
