const { getState, updateQuest, addActivity } = require('../shared/state');

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
    res.status(200).json(state.quests);
  } else if (req.method === 'POST') {
    // Handle quest completion - expect { questId } in body
    const { questId } = req.body;
    const state = getState();
    const quest = state.quests.find(q => q.id == questId);
    
    if (quest) {
      quest.completed = true;
      state.user.avatar.xp += quest.xpReward;
      
      // Add activity for quest completion
      addActivity({
        id: Date.now(),
        user: state.user.username,
        action: `completed quest "${quest.title}"`,
        timestamp: new Date()
      });
      
      res.status(200).json({ message: 'Quest completed!', xpGained: quest.xpReward });
    } else {
      res.status(404).json({ message: 'Quest not found' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
