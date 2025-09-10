// Database state management for serverless functions
// Uses Supabase PostgreSQL for persistent storage

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
let supabase = null;
const initSupabase = () => {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
};

// Fallback to in-memory state if no database
let gameState = null;

const initializeState = () => {
  if (!gameState) {
    const { mockUser, mockQuests, mockAchievements, mockEquipment, mockDuels, mockActivityFeed, mockRaidBoss, mockGyms } = require('./mockData');
    
    // Create deep copies to avoid reference issues
    gameState = {
      user: JSON.parse(JSON.stringify(mockUser)),
      quests: JSON.parse(JSON.stringify(mockQuests)),
      achievements: JSON.parse(JSON.stringify(mockAchievements)),
      equipment: JSON.parse(JSON.stringify(mockEquipment)),
      duels: JSON.parse(JSON.stringify(mockDuels)),
      activityFeed: JSON.parse(JSON.stringify(mockActivityFeed)),
      raidBoss: JSON.parse(JSON.stringify(mockRaidBoss)),
      gyms: JSON.parse(JSON.stringify(mockGyms))
    };
  }
  return gameState;
};

// Database operations with fallback to in-memory
const getUser = async () => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('users')
        .select('*')
        .eq('username', 'TestWarrior')
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        username: data.username,
        gym: data.gym,
        workoutStreak: data.workout_streak,
        lastWorkout: data.last_workout,
        avatar: {
          level: data.level,
          xp: data.xp,
          strength: data.strength,
          endurance: data.endurance,
          agility: data.agility,
          equipment: data.equipment,
          inventory: data.inventory
        }
      };
    } catch (error) {
      console.log('Database error, falling back to mock data:', error.message);
    }
  }
  
  // Fallback to in-memory state
  const state = initializeState();
  return state.user;
};

const updateUser = async (updates) => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('users')
        .update({
          gym: updates.gym,
          workout_streak: updates.workoutStreak,
          last_workout: updates.lastWorkout,
          level: updates.avatar?.level,
          xp: updates.avatar?.xp,
          strength: updates.avatar?.strength,
          endurance: updates.avatar?.endurance,
          agility: updates.avatar?.agility,
          equipment: updates.avatar?.equipment,
          inventory: updates.avatar?.inventory
        })
        .eq('username', 'TestWarrior')
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Database update error, using fallback:', error.message);
    }
  }
  
  // Fallback to in-memory
  const state = initializeState();
  Object.assign(state.user, updates);
  return state.user;
};

const getRaidBoss = async () => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('raid_boss')
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        name: data.name,
        description: data.description,
        totalHP: data.total_hp,
        currentHP: data.current_hp,
        participants: data.participants
      };
    } catch (error) {
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  const state = initializeState();
  return state.raidBoss;
};

const updateRaidBoss = async (updates) => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('raid_boss')
        .update({
          current_hp: updates.currentHP,
          participants: updates.participants
        })
        .eq('id', 1)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  const state = initializeState();
  Object.assign(state.raidBoss, updates);
  return state.raidBoss;
};

const getQuests = async () => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('quests')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      return data.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        completed: quest.completed,
        progress: quest.progress,
        xpReward: quest.xp_reward,
        reward: quest.reward
      }));
    } catch (error) {
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  const state = initializeState();
  return state.quests;
};

const updateQuest = async (questId, updates) => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('quests')
        .update(updates)
        .eq('id', questId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  const state = initializeState();
  const quest = state.quests.find(q => q.id == questId);
  if (quest) {
    Object.assign(quest, updates);
  }
  return quest;
};

const addActivity = async (activity) => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('activities')
        .insert([{
          username: activity.user,
          action: activity.action
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Database insert error:', error.message);
    }
  }
  
  const state = initializeState();
  state.activityFeed.unshift(activity);
  if (state.activityFeed.length > 20) {
    state.activityFeed = state.activityFeed.slice(0, 20);
  }
  return activity;
};

module.exports = {
  getUser,
  updateUser,
  getRaidBoss,
  updateRaidBoss,
  getQuests,
  updateQuest,
  addActivity
};
