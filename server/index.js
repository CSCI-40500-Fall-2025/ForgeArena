const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Data
let mockUser = {
  id: 1,
  username: 'TestWarrior',
  gym: 'PowerHouse Fitness',
  workoutStreak: 3,
  lastWorkout: new Date().toISOString().split('T')[0],
  avatar: {
    level: 1,
    xp: 0,
    strength: 10,
    endurance: 10,
    agility: 10,
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    },
    inventory: ['basic_gloves', 'water_bottle']
  }
};

let mockQuests = [
  { id: 1, title: 'First Steps', description: 'Complete your first workout', completed: false, xpReward: 50, reward: { item: 'training_shoes' } },
  { id: 2, title: 'Cardio Warrior', description: 'Run 5 miles total', progress: '0/5', completed: false, xpReward: 200, reward: { item: 'running_gear' } },
  { id: 3, title: 'Strength Builder', description: 'Complete 100 reps', progress: '0/100', completed: false, xpReward: 150, reward: { item: 'weight_belt' } },
  { id: 4, title: 'Streak Master', description: 'Maintain a 7-day workout streak', progress: '3/7', completed: false, xpReward: 300, reward: { item: 'champion_badge' } },
  { id: 5, title: 'Social Butterfly', description: 'Challenge 3 gym buddies to duels', progress: '0/3', completed: false, xpReward: 100, reward: { item: 'friendship_ring' } }
];

let mockAchievements = [
  { id: 1, name: 'First Blood', description: 'Complete your first workout', unlocked: true, icon: '🏆' },
  { id: 2, name: 'Level Up!', description: 'Reach level 2', unlocked: false, icon: '⬆️' },
  { id: 3, name: 'Streak Warrior', description: 'Maintain a 5-day streak', unlocked: false, icon: '🔥' },
  { id: 4, name: 'Boss Slayer', description: 'Deal 1000 damage to raid boss', unlocked: false, icon: '⚔️' },
  { id: 5, name: 'Gym Legend', description: 'Reach top 3 on leaderboard', unlocked: false, icon: '👑' }
];

let mockEquipment = {
  basic_gloves: { name: 'Basic Gloves', type: 'accessory', stats: { strength: 1 }, rarity: 'common' },
  training_shoes: { name: 'Training Shoes', type: 'accessory', stats: { agility: 2 }, rarity: 'common' },
  running_gear: { name: 'Running Gear', type: 'armor', stats: { endurance: 3 }, rarity: 'uncommon' },
  weight_belt: { name: 'Weight Belt', type: 'accessory', stats: { strength: 3 }, rarity: 'uncommon' },
  champion_badge: { name: 'Champion Badge', type: 'accessory', stats: { strength: 1, endurance: 1, agility: 1 }, rarity: 'rare' },
  water_bottle: { name: 'Water Bottle', type: 'accessory', stats: { endurance: 1 }, rarity: 'common' }
};

let mockDuels = [
  { id: 1, challenger: 'TestWarrior', opponent: 'GymHero99', status: 'pending', challenge: 'Most squats in 24h', deadline: new Date(Date.now() + 24*60*60*1000) },
  { id: 2, challenger: 'FitWarrior', opponent: 'TestWarrior', status: 'active', challenge: 'Most push-ups in 1 hour', deadline: new Date(Date.now() + 60*60*1000) }
];

let mockActivityFeed = [
  { id: 1, user: 'GymHero99', action: 'leveled up to level 16', timestamp: new Date(Date.now() - 30*60*1000) },
  { id: 2, user: 'FitWarrior', action: 'completed quest "Cardio Warrior"', timestamp: new Date(Date.now() - 45*60*1000) },
  { id: 3, user: 'StrengthMaster', action: 'dealt 250 damage to The Titan Squat', timestamp: new Date(Date.now() - 60*60*1000) },
  { id: 4, user: 'TestWarrior', action: 'started a 3-day workout streak', timestamp: new Date(Date.now() - 2*60*60*1000) }
];

let mockRaidBoss = {
  name: 'The Titan Squat',
  description: 'Defeat with collective squats!',
  totalHP: 10000,
  currentHP: 8500,
  participants: 47
};

// API Routes
app.get('/api/user', (req, res) => {
  res.json(mockUser);
});

app.post('/api/workout', (req, res) => {
  const { exercise, reps } = req.body;
  const xpGained = reps * 2; // Simple XP calculation
  
  mockUser.avatar.xp += xpGained;
  
  // Level up logic
  while (mockUser.avatar.xp >= mockUser.avatar.level * 100) {
    mockUser.avatar.xp -= mockUser.avatar.level * 100;
    mockUser.avatar.level++;
    mockUser.avatar.strength += 2;
    mockUser.avatar.endurance += 2;
    mockUser.avatar.agility += 1;
  }
  
  // Update quest progress
  if (exercise === 'squat') {
    mockRaidBoss.currentHP = Math.max(0, mockRaidBoss.currentHP - reps);
  }
  
  res.json({ 
    message: `Great ${exercise} session!`, 
    xpGained, 
    newLevel: mockUser.avatar.level,
    avatar: mockUser.avatar 
  });
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
  res.json([
    { username: 'GymHero99', level: 15, xp: 2340 },
    { username: 'FitWarrior', level: 12, xp: 1890 },
    { username: mockUser.username, level: mockUser.avatar.level, xp: mockUser.avatar.xp },
    { username: 'StrengthMaster', level: 8, xp: 1200 },
    { username: 'CardioQueen', level: 7, xp: 980 }
  ].sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp)));
});

// Equipment and inventory endpoints
app.get('/api/inventory', (req, res) => {
  const inventory = mockUser.avatar.inventory.map(itemId => ({
    id: itemId,
    ...mockEquipment[itemId]
  }));
  res.json(inventory);
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
  res.json([
    { id: 1, name: 'PowerHouse Fitness', members: 47, location: 'Downtown' },
    { id: 2, name: 'Iron Paradise', members: 32, location: 'Uptown' },
    { id: 3, name: 'Flex Zone', members: 28, location: 'Suburbs' },
    { id: 4, name: 'Beast Mode Gym', members: 19, location: 'East Side' }
  ]);
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
