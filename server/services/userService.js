const { pool } = require('../config/database');

class UserService {
  static async getUser(username = 'TestWarrior') {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        gym: user.gym,
        workoutStreak: user.workout_streak,
        lastWorkout: user.last_workout,
        avatar: {
          level: user.level,
          xp: user.xp,
          strength: user.strength,
          endurance: user.endurance,
          agility: user.agility,
          equipment: user.equipment,
          inventory: user.inventory
        }
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  static async updateUser(username, updates) {
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.gym !== undefined) {
        setClause.push(`gym = $${paramCount++}`);
        values.push(updates.gym);
      }
      if (updates.workoutStreak !== undefined) {
        setClause.push(`workout_streak = $${paramCount++}`);
        values.push(updates.workoutStreak);
      }
      if (updates.lastWorkout !== undefined) {
        setClause.push(`last_workout = $${paramCount++}`);
        values.push(updates.lastWorkout);
      }
      if (updates.avatar) {
        const avatar = updates.avatar;
        if (avatar.level !== undefined) {
          setClause.push(`level = $${paramCount++}`);
          values.push(avatar.level);
        }
        if (avatar.xp !== undefined) {
          setClause.push(`xp = $${paramCount++}`);
          values.push(avatar.xp);
        }
        if (avatar.strength !== undefined) {
          setClause.push(`strength = $${paramCount++}`);
          values.push(avatar.strength);
        }
        if (avatar.endurance !== undefined) {
          setClause.push(`endurance = $${paramCount++}`);
          values.push(avatar.endurance);
        }
        if (avatar.agility !== undefined) {
          setClause.push(`agility = $${paramCount++}`);
          values.push(avatar.agility);
        }
        if (avatar.equipment !== undefined) {
          setClause.push(`equipment = $${paramCount++}`);
          values.push(JSON.stringify(avatar.equipment));
        }
        if (avatar.inventory !== undefined) {
          setClause.push(`inventory = $${paramCount++}`);
          values.push(JSON.stringify(avatar.inventory));
        }
      }

      values.push(username);
      
      const query = `UPDATE users SET ${setClause.join(', ')} WHERE username = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async processWorkout(username, exercise, reps) {
    try {
      const user = await this.getUser(username);
      const xpGained = reps * 2;
      
      let newXp = user.avatar.xp + xpGained;
      let newLevel = user.avatar.level;
      let newStrength = user.avatar.strength;
      let newEndurance = user.avatar.endurance;
      let newAgility = user.avatar.agility;

      // Level up logic
      while (newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
        newStrength += 2;
        newEndurance += 2;
        newAgility += 1;
      }

      // Update user
      await this.updateUser(username, {
        avatar: {
          xp: newXp,
          level: newLevel,
          strength: newStrength,
          endurance: newEndurance,
          agility: newAgility
        },
        lastWorkout: new Date().toISOString().split('T')[0]
      });

      // Update raid boss if squats
      if (exercise === 'squat') {
        await pool.query(
          'UPDATE raid_boss SET current_hp = GREATEST(0, current_hp - $1) WHERE id = 1',
          [reps]
        );
      }

      return {
        message: `Great ${exercise} session!`,
        xpGained,
        newLevel,
        avatar: {
          level: newLevel,
          xp: newXp,
          strength: newStrength,
          endurance: newEndurance,
          agility: newAgility,
          equipment: user.avatar.equipment,
          inventory: user.avatar.inventory
        }
      };
    } catch (error) {
      console.error('Error processing workout:', error);
      throw error;
    }
  }
}

module.exports = UserService;
