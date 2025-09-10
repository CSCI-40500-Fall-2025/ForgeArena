// Simple state management for serverless functions
// Uses global variables to persist state within the same container

// Initialize state from mockData if not already initialized
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

const getState = () => {
  return initializeState();
};

const updateUser = (updates) => {
  const state = getState();
  Object.assign(state.user, updates);
  return state.user;
};

const updateRaidBoss = (updates) => {
  const state = getState();
  Object.assign(state.raidBoss, updates);
  return state.raidBoss;
};

const updateQuest = (questId, updates) => {
  const state = getState();
  const quest = state.quests.find(q => q.id == questId);
  if (quest) {
    Object.assign(quest, updates);
  }
  return quest;
};

const addDuel = (duel) => {
  const state = getState();
  state.duels.push(duel);
  return duel;
};

const addActivity = (activity) => {
  const state = getState();
  state.activityFeed.unshift(activity); // Add to beginning
  // Keep only last 20 activities
  if (state.activityFeed.length > 20) {
    state.activityFeed = state.activityFeed.slice(0, 20);
  }
  return activity;
};

module.exports = {
  getState,
  updateUser,
  updateRaidBoss,
  updateQuest,
  addDuel,
  addActivity
};
