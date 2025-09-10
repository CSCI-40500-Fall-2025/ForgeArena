const { getQuests, updateQuest, updateUser, addActivity } = require('../shared/state');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const quests = await getQuests();
      res.status(200).json(quests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      // Handle quest completion - expect { questId } in body
      const { questId } = req.body;
      const quests = await getQuests();
      const quest = quests.find(q => q.id == questId);
      
      if (quest) {
        await updateQuest(questId, { completed: true });
        
        // Add activity for quest completion
        await addActivity({
          user: 'TestWarrior',
          action: `completed quest "${quest.title}"`
        });
        
        res.status(200).json({ message: 'Quest completed!', xpGained: quest.xpReward });
      } else {
        res.status(404).json({ message: 'Quest not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
