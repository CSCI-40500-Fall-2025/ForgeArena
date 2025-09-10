require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, seedDatabase } = require('./config/database');
const UserService = require('./services/userService');
const GameService = require('./services/gameService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase().then(async () => {
  // Only seed if database is connected
  try {
    await seedDatabase();
  } catch (error) {
    console.log('Database seeding skipped:', error.message);
  }
}).catch(error => {
  console.log('Database initialization failed:', error.message);
});

// API Routes
app.get('/api/user', async (req, res) => {
  try {
    const user = await UserService.getUser();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workout', async (req, res) => {
  try {
    const { exercise, reps } = req.body;
    const result = await UserService.processWorkout('TestWarrior', exercise, reps);
    
    // Add activity for workout
    await GameService.addActivity('TestWarrior', `completed ${reps} ${exercise}s`);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quests', async (req, res) => {
  try {
    const quests = await GameService.getQuests();
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quest/:id/complete', async (req, res) => {
  try {
    const result = await GameService.completeQuest(req.params.id, 'TestWarrior');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/raid', async (req, res) => {
  try {
    const raidBoss = await GameService.getRaidBoss();
    res.json(raidBoss);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await GameService.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Equipment and inventory endpoints
app.get('/api/inventory', async (req, res) => {
  try {
    const user = await UserService.getUser();
    const equipment = GameService.getEquipment();
    const inventory = user.avatar.inventory.map(itemId => ({
      id: itemId,
      ...equipment[itemId]
    }));
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/equip/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const user = await UserService.getUser();
    const equipment = GameService.getEquipment();
    const item = equipment[itemId];
    
    if (!item || !user.avatar.inventory.includes(itemId)) {
      return res.status(400).json({ message: 'Item not found in inventory' });
    }

    // Unequip current item of same type
    const currentEquipped = user.avatar.equipment[item.type];
    if (currentEquipped) {
      user.avatar.inventory.push(currentEquipped);
    }

    // Equip new item
    user.avatar.equipment[item.type] = itemId;
    user.avatar.inventory = user.avatar.inventory.filter(id => id !== itemId);

    // Apply stat bonuses
    Object.keys(item.stats).forEach(stat => {
      user.avatar[stat] += item.stats[stat];
    });

    // Update user in database
    await UserService.updateUser('TestWarrior', { avatar: user.avatar });

    res.json({ message: `Equipped ${item.name}!`, equipment: user.avatar.equipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Achievements endpoint
app.get('/api/achievements', (req, res) => {
  res.json(GameService.getAchievements());
});

// Duels endpoint
app.get('/api/duels', async (req, res) => {
  try {
    const duels = await GameService.getDuels();
    res.json(duels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/duel/create', async (req, res) => {
  try {
    const { opponent, challenge } = req.body;
    const result = await GameService.createDuel('TestWarrior', opponent, challenge);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity feed endpoint
app.get('/api/activity', async (req, res) => {
  try {
    const activities = await GameService.getActivities();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gym selection endpoint
app.get('/api/gyms', (req, res) => {
  res.json(GameService.getGyms());
});

app.post('/api/gym/join/:gymId', async (req, res) => {
  try {
    const result = await GameService.joinGym('TestWarrior', req.params.gymId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`ForgeArena API running on port ${PORT}`);
});
