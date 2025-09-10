const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import shared data and logic
const { 
  mockUser, 
  mockQuests, 
  mockAchievements, 
  mockDuels, 
  mockActivityFeed, 
  mockRaidBoss, 
  mockGyms 
} = require('../shared/mockData');

const { 
  processWorkout, 
  getLeaderboard, 
  getInventory 
} = require('../shared/gameLogic');

// API Routes
app.get('/api/user', (req, res) => {
  res.json(mockUser);
});

app.post('/api/workout', (req, res) => {
  const { exercise, reps } = req.body;
  const result = processWorkout(exercise, reps);
  res.json(result);
});

app.get('/api/quests', (req, res) => {
  res.json(mockQuests);
});

app.post('/api/quest/:id/complete', (req, res) => {
  const quest = mockQuests.find(q => q.id == req.params.id);
  if (quest) {
    quest.completed = true;
    mockUser.avatar.xp += quest.xpReward;
    res.json({ message: 'Quest completed!', xpGained: quest.xpReward });
  } else {
    res.status(404).json({ message: 'Quest not found' });
  }
});

app.get('/api/raid', (req, res) => {
  res.json(mockRaidBoss);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

// Equipment and inventory endpoints
app.get('/api/inventory', (req, res) => {
  res.json(getInventory());
});

app.post('/api/equip/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const item = mockEquipment[itemId];
  
  if (!item || !mockUser.avatar.inventory.includes(itemId)) {
    return res.status(400).json({ message: 'Item not found in inventory' });
  }

  // Unequip current item of same type
  const currentEquipped = mockUser.avatar.equipment[item.type];
  if (currentEquipped) {
    mockUser.avatar.inventory.push(currentEquipped);
  }

  // Equip new item
  mockUser.avatar.equipment[item.type] = itemId;
  mockUser.avatar.inventory = mockUser.avatar.inventory.filter(id => id !== itemId);

  // Apply stat bonuses
  Object.keys(item.stats).forEach(stat => {
    mockUser.avatar[stat] += item.stats[stat];
  });

  res.json({ message: `Equipped ${item.name}!`, equipment: mockUser.avatar.equipment });
});

// Achievements endpoint
app.get('/api/achievements', (req, res) => {
  res.json(mockAchievements);
});

// Duels endpoint
app.get('/api/duels', (req, res) => {
  res.json(mockDuels);
});

app.post('/api/duel/create', (req, res) => {
  const { opponent, challenge } = req.body;
  const newDuel = {
    id: mockDuels.length + 1,
    challenger: mockUser.username,
    opponent,
    status: 'pending',
    challenge,
    deadline: new Date(Date.now() + 24*60*60*1000)
  };
  mockDuels.push(newDuel);
  res.json({ message: `Duel challenge sent to ${opponent}!`, duel: newDuel });
});

// Activity feed endpoint
app.get('/api/activity', (req, res) => {
  res.json(mockActivityFeed);
});

// Gym selection endpoint
app.get('/api/gyms', (req, res) => {
  res.json(mockGyms);
});

app.post('/api/gym/join/:gymId', (req, res) => {
  const gymNames = {
    1: 'PowerHouse Fitness',
    2: 'Iron Paradise', 
    3: 'Flex Zone',
    4: 'Beast Mode Gym'
  };
  
  const gymName = gymNames[req.params.gymId];
  if (gymName) {
    mockUser.gym = gymName;
    res.json({ message: `Joined ${gymName}!`, gym: gymName });
  } else {
    res.status(404).json({ message: 'Gym not found' });
  }
});

app.listen(PORT, () => {
  console.log(`ForgeArena API running on port ${PORT}`);
});
