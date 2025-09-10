const { pool } = require('../config/database');

class GameService {
  static async getQuests() {
    try {
      const result = await pool.query('SELECT * FROM quests ORDER BY id');
      return result.rows.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        completed: quest.completed,
        progress: quest.progress,
        xpReward: quest.xp_reward,
        reward: quest.reward
      }));
    } catch (error) {
      console.error('Error getting quests:', error);
      throw error;
    }
  }

  static async completeQuest(questId, username) {
    try {
      // Get quest details
      const questResult = await pool.query('SELECT * FROM quests WHERE id = $1', [questId]);
      if (questResult.rows.length === 0) {
        throw new Error('Quest not found');
      }

      const quest = questResult.rows[0];
      
      // Mark quest as completed
      await pool.query('UPDATE quests SET completed = true WHERE id = $1', [questId]);
      
      // Update user XP
      await pool.query('UPDATE users SET xp = xp + $1 WHERE username = $2', [quest.xp_reward, username]);
      
      // Add activity
      await this.addActivity(username, `completed quest "${quest.title}"`);
      
      return { message: 'Quest completed!', xpGained: quest.xp_reward };
    } catch (error) {
      console.error('Error completing quest:', error);
      throw error;
    }
  }

  static async getRaidBoss() {
    try {
      const result = await pool.query('SELECT * FROM raid_boss ORDER BY id LIMIT 1');
      if (result.rows.length === 0) {
        throw new Error('Raid boss not found');
      }
      
      const boss = result.rows[0];
      return {
        name: boss.name,
        description: boss.description,
        totalHP: boss.total_hp,
        currentHP: boss.current_hp,
        participants: boss.participants
      };
    } catch (error) {
      console.error('Error getting raid boss:', error);
      throw error;
    }
  }

  static async getLeaderboard() {
    try {
      const result = await pool.query(`
        SELECT username, level, xp, (level * 1000 + xp) as score
        FROM users 
        ORDER BY score DESC 
        LIMIT 10
      `);
      
      // Add some mock competitors
      const mockCompetitors = [
        { username: 'GymHero99', level: 15, xp: 2340, score: 17340 },
        { username: 'FitWarrior', level: 12, xp: 1890, score: 13890 },
        { username: 'StrengthMaster', level: 8, xp: 1200, score: 9200 },
        { username: 'CardioQueen', level: 7, xp: 980, score: 7980 }
      ];

      const allUsers = [...result.rows, ...mockCompetitors];
      return allUsers.sort((a, b) => b.score - a.score).slice(0, 10);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  static async getDuels() {
    try {
      const result = await pool.query('SELECT * FROM duels ORDER BY created_at DESC');
      return result.rows.map(duel => ({
        id: duel.id,
        challenger: duel.challenger,
        opponent: duel.opponent,
        status: duel.status,
        challenge: duel.challenge,
        deadline: duel.deadline
      }));
    } catch (error) {
      console.error('Error getting duels:', error);
      throw error;
    }
  }

  static async createDuel(challenger, opponent, challenge) {
    try {
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await pool.query(`
        INSERT INTO duels (challenger, opponent, challenge, deadline)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [challenger, opponent, challenge, deadline]);
      
      const duel = result.rows[0];
      return {
        message: `Duel challenge sent to ${opponent}!`,
        duel: {
          id: duel.id,
          challenger: duel.challenger,
          opponent: duel.opponent,
          status: duel.status,
          challenge: duel.challenge,
          deadline: duel.deadline
        }
      };
    } catch (error) {
      console.error('Error creating duel:', error);
      throw error;
    }
  }

  static async getActivities() {
    try {
      const result = await pool.query(`
        SELECT * FROM activities 
        ORDER BY timestamp DESC 
        LIMIT 20
      `);
      
      return result.rows.map(activity => ({
        id: activity.id,
        user: activity.username,
        action: activity.action,
        timestamp: activity.timestamp
      }));
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  }

  static async addActivity(username, action) {
    try {
      await pool.query(`
        INSERT INTO activities (username, action)
        VALUES ($1, $2)
      `, [username, action]);
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  static getGyms() {
    // Static gym data
    return [
      { id: 1, name: 'PowerHouse Fitness', members: 47, location: 'Downtown' },
      { id: 2, name: 'Iron Paradise', members: 32, location: 'Uptown' },
      { id: 3, name: 'Flex Zone', members: 28, location: 'Suburbs' },
      { id: 4, name: 'Beast Mode Gym', members: 19, location: 'East Side' }
    ];
  }

  static async joinGym(username, gymId) {
    try {
      const gymNames = {
        1: 'PowerHouse Fitness',
        2: 'Iron Paradise',
        3: 'Flex Zone',
        4: 'Beast Mode Gym'
      };

      const gymName = gymNames[gymId];
      if (!gymName) {
        throw new Error('Gym not found');
      }

      await pool.query('UPDATE users SET gym = $1 WHERE username = $2', [gymName, username]);
      
      return { message: `Joined ${gymName}!`, gym: gymName };
    } catch (error) {
      console.error('Error joining gym:', error);
      throw error;
    }
  }

  static getEquipment() {
    return {
      basic_gloves: { name: 'Basic Gloves', type: 'accessory', stats: { strength: 1 }, rarity: 'common' },
      training_shoes: { name: 'Training Shoes', type: 'accessory', stats: { agility: 2 }, rarity: 'common' },
      running_gear: { name: 'Running Gear', type: 'armor', stats: { endurance: 3 }, rarity: 'uncommon' },
      weight_belt: { name: 'Weight Belt', type: 'accessory', stats: { strength: 3 }, rarity: 'uncommon' },
      champion_badge: { name: 'Champion Badge', type: 'accessory', stats: { strength: 1, endurance: 1, agility: 1 }, rarity: 'rare' },
      water_bottle: { name: 'Water Bottle', type: 'accessory', stats: { endurance: 1 }, rarity: 'common' }
    };
  }

  static getAchievements() {
    return [
      { id: 1, name: 'First Blood', description: 'Complete your first workout', unlocked: true, icon: '🏆' },
      { id: 2, name: 'Level Up!', description: 'Reach level 2', unlocked: false, icon: '⬆️' },
      { id: 3, name: 'Streak Warrior', description: 'Maintain a 5-day streak', unlocked: false, icon: '🔥' },
      { id: 4, name: 'Boss Slayer', description: 'Deal 1000 damage to raid boss', unlocked: false, icon: '⚔️' },
      { id: 5, name: 'Gym Legend', description: 'Reach top 3 on leaderboard', unlocked: false, icon: '👑' }
    ];
  }
}

module.exports = GameService;
