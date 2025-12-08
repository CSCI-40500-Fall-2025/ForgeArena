// Shared game logic for processing workouts and calculating XP
// Updated to work with real user data (passed as parameter)

/**
 * XP gain multipliers for different exercises
 */
const EXERCISE_MULTIPLIERS = {
  squat: 2.0,
  pushup: 1.5,
  pullup: 2.5,
  run: 1.0,
  plank: 0.5,
  burpee: 3.0,
  lunge: 1.5,
  deadlift: 2.5,
  bench: 2.0,
  row: 2.0,
  default: 1.0,
};

/**
 * Stat bonuses for different exercises
 */
const EXERCISE_STATS = {
  squat: { strength: 0.3, endurance: 0.1 },
  pushup: { strength: 0.2, endurance: 0.2 },
  pullup: { strength: 0.3, agility: 0.1 },
  run: { endurance: 0.4, agility: 0.2 },
  plank: { endurance: 0.3, strength: 0.1 },
  burpee: { strength: 0.1, endurance: 0.2, agility: 0.2 },
  lunge: { strength: 0.2, agility: 0.2 },
  deadlift: { strength: 0.4 },
  bench: { strength: 0.3 },
  row: { strength: 0.25, endurance: 0.1 },
  default: { strength: 0.1, endurance: 0.1 },
};

/**
 * Process a workout and calculate XP/stat gains
 * @param {Object} user - The user object (can be null for anonymous calculations)
 * @param {string} exercise - The type of exercise
 * @param {number} reps - Number of reps/duration
 * @returns {Object} Result with XP gained and other data
 */
const processWorkout = (user, exercise, reps) => {
  // Get multiplier for exercise type
  const multiplier = EXERCISE_MULTIPLIERS[exercise] || EXERCISE_MULTIPLIERS.default;
  
  // Calculate base XP
  const baseXP = reps * multiplier;
  
  // Apply level bonus (higher level = slightly more XP per rep)
  const userLevel = user?.level || 1;
  const levelBonus = 1 + (userLevel * 0.02); // 2% bonus per level
  
  // Apply streak bonus
  const streak = user?.workoutStreak || 0;
  const streakBonus = 1 + Math.min(streak * 0.05, 0.5); // Max 50% streak bonus
  
  // Calculate final XP
  const xpGained = Math.round(baseXP * levelBonus * streakBonus);
  
  // Calculate potential stat gains
  const statGains = EXERCISE_STATS[exercise] || EXERCISE_STATS.default;
  const scaledStatGains = {};
  
  Object.keys(statGains).forEach(stat => {
    // Stats gain scales with reps but has diminishing returns
    const gain = statGains[stat] * Math.log10(reps + 1);
    scaledStatGains[stat] = Math.round(gain * 10) / 10;
  });
  
  // Calculate damage potential for raids
  const raidDamage = Math.floor(baseXP * (1 + userLevel * 0.1));
  
  return {
    message: `Great ${formatExerciseName(exercise)} session!`,
    xpGained,
    exercise,
    reps,
    statGains: scaledStatGains,
    raidDamage,
    bonuses: {
      level: levelBonus,
      streak: streakBonus,
    },
  };
};

/**
 * Format exercise name for display
 */
const formatExerciseName = (exercise) => {
  const names = {
    squat: 'squat',
    pushup: 'push-up',
    pullup: 'pull-up',
    run: 'running',
    plank: 'plank',
    burpee: 'burpee',
    lunge: 'lunge',
    deadlift: 'deadlift',
    bench: 'bench press',
    row: 'row',
  };
  return names[exercise] || exercise;
};

/**
 * Calculate XP needed for next level
 */
const getXPForLevel = (level) => {
  return level * 100; // Simple: 100 XP per level
};

/**
 * Calculate level from total XP
 */
const getLevelFromXP = (totalXP) => {
  return Math.floor(totalXP / 100) + 1;
};

/**
 * Calculate XP progress towards next level
 */
const getLevelProgress = (totalXP) => {
  const currentLevel = getLevelFromXP(totalXP);
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpIntoLevel = totalXP - xpForCurrentLevel;
  const xpNeeded = 100; // Fixed 100 per level
  
  return {
    currentLevel,
    xpIntoLevel,
    xpNeeded,
    percentage: Math.round((xpIntoLevel / xpNeeded) * 100),
  };
};

/**
 * Calculate player power for club battles
 */
const calculatePlayerPower = (user) => {
  if (!user) return 0;
  
  const level = user.level || 1;
  const strength = user.strength || 10;
  const endurance = user.endurance || 10;
  const agility = user.agility || 10;
  
  // Base power from stats
  const statPower = strength + endurance + agility;
  
  // Level multiplier
  const levelMultiplier = 1 + (level * 0.1);
  
  // Equipment bonus (if any)
  const equipmentBonus = calculateEquipmentBonus(user.equipment);
  
  return Math.round(statPower * levelMultiplier + equipmentBonus);
};

/**
 * Calculate bonus from equipped items
 */
const calculateEquipmentBonus = (equipment) => {
  if (!equipment) return 0;
  
  let bonus = 0;
  // This would integrate with the item system
  // For now, return a placeholder based on equipment count
  const equippedCount = Object.values(equipment).filter(e => e).length;
  return equippedCount * 5;
};

/**
 * Get exercise suggestions based on user history
 */
const getExerciseSuggestions = (user) => {
  const allExercises = Object.keys(EXERCISE_MULTIPLIERS).filter(e => e !== 'default');
  const recentExercises = user?.recentExercises || [];
  
  // Prioritize exercises not done recently
  const suggestions = allExercises
    .map(exercise => ({
      exercise,
      name: formatExerciseName(exercise),
      multiplier: EXERCISE_MULTIPLIERS[exercise],
      stats: EXERCISE_STATS[exercise] || EXERCISE_STATS.default,
      recentlyDone: recentExercises.includes(exercise),
    }))
    .sort((a, b) => {
      // Prioritize not recently done
      if (a.recentlyDone !== b.recentlyDone) {
        return a.recentlyDone ? 1 : -1;
      }
      // Then by XP multiplier
      return b.multiplier - a.multiplier;
    });
  
  return suggestions;
};

/**
 * Calculate raid damage from a workout
 */
const calculateRaidDamage = (exercise, reps, userLevel = 1) => {
  const multiplier = EXERCISE_MULTIPLIERS[exercise] || EXERCISE_MULTIPLIERS.default;
  const baseDamage = reps * multiplier;
  const levelBonus = 1 + (userLevel * 0.1);
  
  return Math.floor(baseDamage * levelBonus);
};

/**
 * Validate workout input
 */
const validateWorkout = (exercise, reps) => {
  const errors = [];
  
  if (!exercise || typeof exercise !== 'string') {
    errors.push('Exercise type is required');
  }
  
  if (typeof reps !== 'number' || reps <= 0) {
    errors.push('Reps must be a positive number');
  }
  
  if (reps > 10000) {
    errors.push('Reps cannot exceed 10,000');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  processWorkout,
  getXPForLevel,
  getLevelFromXP,
  getLevelProgress,
  calculatePlayerPower,
  getExerciseSuggestions,
  calculateRaidDamage,
  validateWorkout,
  formatExerciseName,
  EXERCISE_MULTIPLIERS,
  EXERCISE_STATS,
};
