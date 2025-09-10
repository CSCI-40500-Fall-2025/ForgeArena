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
  avatar: {
    level: 1,
    xp: 0,
    strength: 10,
    endurance: 10,
    agility: 10,
    equipment: []
  }
};

let mockQuests = [
  { id: 1, title: 'First Steps', description: 'Complete your first workout', completed: false, xpReward: 50 },
  { id: 2, title: 'Cardio Warrior', description: 'Run 5 miles total', progress: '0/5', completed: false, xpReward: 200 },
  { id: 3, title: 'Strength Builder', description: 'Complete 100 reps', progress: '0/100', completed: false, xpReward: 150 }
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

app.listen(PORT, () => {
  console.log(`🚀 ForgeArena API running on port ${PORT}`);
});
