// Simple Supabase integration with fallback to mock data
let supabase = null;

const initSupabase = () => {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      console.log('Supabase initialized successfully');
    } catch (error) {
      console.log('Supabase initialization failed:', error.message);
      supabase = null;
    }
  }
  return supabase;
};

// Get user data
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
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  // Fallback to mock data
  const { mockUser } = require('./mockData');
  return mockUser;
};

// Update user data
const updateUser = async (userUpdates) => {
  const db = initSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('users')
        .update({
          gym: userUpdates.gym,
          workout_streak: userUpdates.workoutStreak,
          last_workout: userUpdates.lastWorkout,
          level: userUpdates.avatar?.level,
          xp: userUpdates.avatar?.xp,
          strength: userUpdates.avatar?.strength,
          endurance: userUpdates.avatar?.endurance,
          agility: userUpdates.avatar?.agility,
          equipment: userUpdates.avatar?.equipment,
          inventory: userUpdates.avatar?.inventory
        })
        .eq('username', 'TestWarrior')
        .select()
        .single();
      
      if (error) throw error;
      console.log('User updated in database');
      return data;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockUser } = require('./mockData');
  Object.assign(mockUser, userUpdates);
  return mockUser;
};

// Get raid boss
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
  
  const { mockRaidBoss } = require('./mockData');
  return mockRaidBoss;
};

// Update raid boss
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
      console.log('Raid boss updated in database');
      return data;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockRaidBoss } = require('./mockData');
  if (updates.currentHP !== undefined) mockRaidBoss.currentHP = updates.currentHP;
  if (updates.participants !== undefined) mockRaidBoss.participants = updates.participants;
  return mockRaidBoss;
};

// Get quests
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
  
  const { mockQuests } = require('./mockData');
  return mockQuests;
};

// Update quest
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
      console.log('Quest updated in database');
      return data;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockQuests } = require('./mockData');
  const quest = mockQuests.find(q => q.id == questId);
  if (quest) {
    Object.assign(quest, updates);
  }
  return quest;
};

module.exports = {
  getUser,
  updateUser,
  getRaidBoss,
  updateRaidBoss,
  getQuests,
  updateQuest
};
