/**
 * @deprecated This mock data is only used for testing purposes.
 * 
 * Production data is now stored in Firestore and managed by services:
 * - User data: server/services/user.service.firestore.js
 * - Quests: server/services/quest.service.js (generates dynamic quests)
 * - Achievements: server/services/achievement.service.js
 * - Duels: server/services/duel.service.js
 * - Activity: server/services/activity.service.js
 * - Leaderboards: server/services/leaderboard.service.js
 * - Raids: server/services/raid.service.js
 * - Clubs: server/services/club.service.js
 * - Parties: server/services/party.service.js
 * 
 * This file is kept for backward compatibility with tests only.
 */

// Shared mock data - FOR TESTING ONLY
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
  { id: 1, title: 'First Steps', description: 'Complete your first workout', completed: false, xpReward: 50, difficulty: 'easy', reward: { item: 'training_shoes' } },
  { id: 2, title: 'Cardio Warrior', description: 'Run 5 miles total', progress: '0/5', completed: false, xpReward: 200, difficulty: 'hard', reward: { item: 'running_gear' } },
  { id: 3, title: 'Strength Builder', description: 'Complete 100 reps', progress: '0/100', completed: false, xpReward: 150, difficulty: 'normal', reward: { item: 'weight_belt' } },
  { id: 4, title: 'Streak Master', description: 'Maintain a 7-day workout streak', progress: '3/7', completed: false, xpReward: 300, difficulty: 'legendary', reward: { item: 'champion_badge' } },
  { id: 5, title: 'Social Butterfly', description: 'Challenge 3 gym buddies to duels', progress: '0/3', completed: false, xpReward: 100, difficulty: 'normal', reward: { item: 'friendship_ring' } },
  { id: 6, title: 'Beast Mode', description: 'Complete 500 total reps in a week', progress: '0/500', completed: false, xpReward: 400, difficulty: 'legendary', reward: { item: 'beast_gauntlets' } },
  { id: 7, title: 'Early Bird', description: 'Work out before 7 AM for 5 days', progress: '0/5', completed: false, xpReward: 175, difficulty: 'hard', reward: { item: 'sunrise_cape' } },
  { id: 8, title: 'Raid Champion', description: 'Deal 1000 damage to raid bosses', progress: '0/1000', completed: false, xpReward: 350, difficulty: 'legendary', reward: { item: 'raid_armor' } }
];

let mockAchievements = [
  { id: 1, name: 'First Blood', description: 'Complete your first workout', unlocked: true, icon: 'trophy' },
  { id: 2, name: 'Level Up!', description: 'Reach level 2', unlocked: false, icon: 'level-up' },
  { id: 3, name: 'Streak Warrior', description: 'Maintain a 5-day streak', unlocked: false, icon: 'streak' },
  { id: 4, name: 'Boss Slayer', description: 'Deal 1000 damage to raid boss', unlocked: false, icon: 'sword' },
  { id: 5, name: 'Gym Legend', description: 'Reach top 3 on leaderboard', unlocked: false, icon: 'crown' }
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

// Legacy gym data (kept for backward compatibility)
const mockGyms = [
  { id: 1, name: 'PowerHouse Fitness', members: 47, location: 'Downtown' },
  { id: 2, name: 'Iron Paradise', members: 32, location: 'Uptown' },
  { id: 3, name: 'Flex Zone', members: 28, location: 'Suburbs' },
  { id: 4, name: 'Beast Mode Gym', members: 19, location: 'East Side' }
];

// New Club System - Clubs compete for control of real-world gym locations
const mockClubs = [
  {
    id: 'club_iron_warriors',
    name: 'Iron Warriors',
    tag: 'IRON',
    description: 'Forged in iron, built to conquer. We dominate every territory we touch.',
    color: '#DC2626',
    emblem: 'shield',
    founderId: 'user_1',
    founderName: 'GymHero99',
    memberCount: 47,
    territoriesControlled: 8,
    totalPower: 752,
    wins: 34,
    losses: 12,
    isRecruiting: true,
    minLevelToJoin: 5,
  },
  {
    id: 'club_flex_nation',
    name: 'Flex Nation',
    tag: 'FLEX',
    description: 'United by gains, driven by excellence. Join the nation!',
    color: '#7C3AED',
    emblem: 'crown',
    founderId: 'user_2',
    founderName: 'FitWarrior',
    memberCount: 32,
    territoriesControlled: 6,
    totalPower: 498,
    wins: 28,
    losses: 15,
    isRecruiting: true,
    minLevelToJoin: 3,
  },
  {
    id: 'club_beast_mode',
    name: 'Beast Mode Elite',
    tag: 'BEAST',
    description: 'Only the strongest survive. Are you beast enough?',
    color: '#059669',
    emblem: 'sword',
    founderId: 'user_3',
    founderName: 'StrengthMaster',
    memberCount: 28,
    territoriesControlled: 5,
    totalPower: 412,
    wins: 22,
    losses: 18,
    isRecruiting: true,
    minLevelToJoin: 10,
  },
  {
    id: 'club_cardio_kings',
    name: 'Cardio Kings',
    tag: 'CARDIO',
    description: 'Endurance is our weapon. We outlast everyone.',
    color: '#0891B2',
    emblem: 'lightning',
    founderId: 'user_4',
    founderName: 'CardioQueen',
    memberCount: 19,
    territoriesControlled: 3,
    totalPower: 287,
    wins: 15,
    losses: 20,
    isRecruiting: true,
    minLevelToJoin: 1,
  },
];

// Mock gym locations (real-world gyms that clubs fight over)
const mockGymLocations = [
  {
    id: 'gym_mock_1',
    placeId: 'mock_place_1',
    name: 'Iron Paradise Fitness',
    address: '123 Main St, Downtown',
    location: { lat: 40.7128, lng: -74.0060 },
    rating: 4.5,
    controllingClubId: 'club_iron_warriors',
    controllingClubName: 'Iron Warriors',
    controllingClubColor: '#DC2626',
    controlStrength: 150,
    defenders: [
      { userId: 'user_1', username: 'GymHero99', level: 15 },
      { userId: 'user_5', username: 'IronFist', level: 12 },
    ],
    totalBattles: 23,
  },
  {
    id: 'gym_mock_2',
    placeId: 'mock_place_2',
    name: 'PowerHouse Gym',
    address: '456 Oak Ave, Uptown',
    location: { lat: 40.7200, lng: -74.0100 },
    rating: 4.2,
    controllingClubId: 'club_flex_nation',
    controllingClubName: 'Flex Nation',
    controllingClubColor: '#7C3AED',
    controlStrength: 120,
    defenders: [
      { userId: 'user_2', username: 'FitWarrior', level: 12 },
    ],
    totalBattles: 18,
  },
  {
    id: 'gym_mock_3',
    placeId: 'mock_place_3',
    name: 'CrossFit Thunder',
    address: '789 Pine Rd, Suburbs',
    location: { lat: 40.7050, lng: -74.0200 },
    rating: 4.8,
    controllingClubId: null,
    controllingClubName: null,
    controllingClubColor: null,
    controlStrength: 0,
    defenders: [],
    totalBattles: 5,
  },
  {
    id: 'gym_mock_4',
    placeId: 'mock_place_4',
    name: 'Planet Fitness',
    address: '321 Elm St, East Side',
    location: { lat: 40.7180, lng: -73.9900 },
    rating: 3.9,
    controllingClubId: 'club_beast_mode',
    controllingClubName: 'Beast Mode Elite',
    controllingClubColor: '#059669',
    controlStrength: 95,
    defenders: [
      { userId: 'user_3', username: 'StrengthMaster', level: 8 },
    ],
    totalBattles: 12,
  },
];

module.exports = {
  mockUser,
  mockQuests,
  mockAchievements,
  mockEquipment,
  mockDuels,
  mockActivityFeed,
  mockRaidBoss,
  mockGyms,
  mockClubs,
  mockGymLocations,
};
