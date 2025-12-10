/**
 * ML Service - AI-powered fitness coaching
 * Provides workout recommendations, predictions, and motivational coaching
 */

const logger = require('../../utils/logger');

// Exercise definitions
const EXERCISES = {
  squat: { name: 'Squats', stat: 'agility', secondary: 'endurance' },
  pushup: { name: 'Push-ups', stat: 'strength', secondary: 'endurance' },
  pullup: { name: 'Pull-ups', stat: 'strength', secondary: 'agility' },
  run: { name: 'Running', stat: 'endurance', secondary: 'agility' }
};

// Motivational messages by context
const MOTIVATIONS = {
  daily: [
    { message: "Every rep brings you closer to your goals!", emoji: "💪", actionPrompt: "Start your workout now" },
    { message: "Champions are made in the gym!", emoji: "🏆", actionPrompt: "Begin today's training" },
    { message: "Your future self will thank you!", emoji: "⭐", actionPrompt: "Let's get moving" },
    { message: "Consistency beats intensity. Show up today!", emoji: "🔥", actionPrompt: "Start a quick session" }
  ],
  streak_broken: [
    { message: "Setbacks are setups for comebacks!", emoji: "💫", actionPrompt: "Rebuild your streak today" },
    { message: "Every champion has fallen. What matters is getting back up!", emoji: "🦾", actionPrompt: "Start fresh now" }
  ],
  level_up: [
    { message: "LEVEL UP! You're getting stronger every day!", emoji: "🎉", actionPrompt: "Keep the momentum going" },
    { message: "New level unlocked! Your dedication is paying off!", emoji: "⬆️", actionPrompt: "Push even harder" }
  ],
  new_user: [
    { message: "Welcome to ForgeArena! Your fitness journey begins now!", emoji: "🚀", actionPrompt: "Complete your first workout" },
    { message: "Every master was once a beginner. Let's start!", emoji: "🌟", actionPrompt: "Try a beginner workout" }
  ]
};

/**
 * Get personalized workout recommendations
 */
async function getWorkoutRecommendations(userData) {
  const { avatar, workoutStreak, recentWorkouts = [] } = userData;
  const level = avatar?.level || 1;
  
  // Determine which stat needs work
  const stats = {
    strength: avatar?.strength || 10,
    endurance: avatar?.endurance || 10,
    agility: avatar?.agility || 10
  };
  
  const weakestStat = Object.entries(stats).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  
  // Find exercise that targets weakest stat
  const exerciseForStat = {
    strength: 'pushup',
    endurance: 'run',
    agility: 'squat'
  };
  
  const recommendedExercise = exerciseForStat[weakestStat] || 'squat';
  const baseReps = 10 + Math.floor(level / 2);
  
  // Check recent workouts to avoid repetition
  const recentExercises = recentWorkouts.slice(-3).map(w => w.exercise);
  let alternatives = Object.keys(EXERCISES).filter(e => e !== recommendedExercise && !recentExercises.includes(e));
  
  if (alternatives.length === 0) {
    alternatives = Object.keys(EXERCISES).filter(e => e !== recommendedExercise);
  }
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    primaryRecommendation: {
      exercise: recommendedExercise,
      reps: baseReps,
      reason: `This targets your ${weakestStat}, which could use some work!`
    },
    alternativeWorkouts: alternatives.slice(0, 2).map(ex => ({
      exercise: ex,
      reps: baseReps - 2
    })),
    motivationalTip: workoutStreak > 0 
      ? `Keep your ${workoutStreak}-day streak alive!` 
      : "Start a new streak today!",
    predictedXP: baseReps * 2,
    focusArea: weakestStat
  };
}

/**
 * Get performance predictions
 */
async function getPerformancePrediction(userData) {
  const { avatar, workoutStreak, recentWorkouts = [] } = userData;
  const level = avatar?.level || 1;
  const xp = avatar?.xp || 0;
  
  const xpPerLevel = 100;
  const xpNeeded = (level * xpPerLevel) - xp;
  const avgXPPerWorkout = 30;
  const daysUntilLevelUp = Math.ceil(xpNeeded / avgXPPerWorkout);
  
  // Analyze stats
  const stats = {
    strength: avatar?.strength || 10,
    endurance: avatar?.endurance || 10,
    agility: avatar?.agility || 10
  };
  
  const strongest = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const weakest = Object.entries(stats).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  
  // Streak analysis
  let streakStatus = 'building';
  let streakRecommendation = 'Keep showing up daily!';
  
  if (workoutStreak >= 30) {
    streakStatus = 'legendary';
    streakRecommendation = 'Incredible dedication! You\'re an inspiration!';
  } else if (workoutStreak >= 14) {
    streakStatus = 'dedicated';
    streakRecommendation = 'Amazing consistency! Keep it up!';
  } else if (workoutStreak >= 7) {
    streakStatus = 'consistent';
    streakRecommendation = 'Great week! Push for two weeks!';
  } else if (workoutStreak === 0) {
    streakStatus = 'starting';
    streakRecommendation = 'Start your streak today!';
  }
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    levelUpPrediction: {
      currentLevel: level,
      xpNeeded,
      daysUntil: daysUntilLevelUp,
      confidence: 'medium'
    },
    streakAnalysis: {
      currentStreak: workoutStreak,
      status: streakStatus,
      recommendation: streakRecommendation
    },
    statsFocus: {
      strongest,
      needsWork: weakest,
      tip: `Focus on ${weakest}-building exercises to balance your stats!`
    },
    weeklyGoal: {
      exercise: weakest === 'strength' ? 'pushup' : weakest === 'endurance' ? 'run' : 'squat',
      target: 100,
      xpReward: 50
    },
    motivationalMessage: `Level ${level + 1} is within reach! Just ${daysUntilLevelUp} more days of training!`
  };
}

/**
 * Get motivational coaching message
 */
async function getMotivationalCoaching(userData, context = 'daily') {
  const messages = MOTIVATIONS[context] || MOTIVATIONS.daily;
  const selected = messages[Math.floor(Math.random() * messages.length)];
  
  // Personalize based on user data
  let personalizedMessage = selected.message;
  if (userData.workoutStreak > 0) {
    personalizedMessage = `${userData.workoutStreak}-day streak! ${selected.message}`;
  }
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    message: personalizedMessage,
    emoji: selected.emoji,
    actionPrompt: selected.actionPrompt
  };
}

/**
 * Get quest suggestions
 */
async function getQuestSuggestions(userData, quests = []) {
  const { avatar } = userData;
  const level = avatar?.level || 1;
  
  // Find easiest quest to complete
  let topQuest = null;
  let strategyTip = "Complete daily quests for steady XP gains!";
  
  if (quests.length > 0) {
    // Sort by progress (closest to completion first)
    const sortedQuests = quests
      .filter(q => q.status !== 'completed')
      .sort((a, b) => {
        const aProgress = (a.progress || 0) / (a.target || 1);
        const bProgress = (b.progress || 0) / (b.target || 1);
        return bProgress - aProgress;
      });
    
    if (sortedQuests.length > 0) {
      const quest = sortedQuests[0];
      topQuest = {
        id: quest.id,
        title: quest.title || quest.name,
        reason: `You're ${Math.round(((quest.progress || 0) / (quest.target || 1)) * 100)}% done!`
      };
      strategyTip = `Focus on "${quest.title || quest.name}" - it's almost complete!`;
    }
  }
  
  if (!topQuest) {
    strategyTip = level < 5 
      ? "Start with beginner quests to build momentum!" 
      : "Challenge yourself with harder quests for bonus XP!";
  }
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    topQuest,
    strategyTip
  };
}

/**
 * Analyze workout patterns
 */
function analyzeWorkoutPatterns(workouts = []) {
  if (workouts.length === 0) {
    return {
      success: true,
      source: 'forgemaster_ai',
      totalWorkouts: 0,
      favoriteExercise: null,
      averageReps: 0,
      consistency: 'new_user',
      trend: 'starting',
      insights: ["Complete your first workout to start tracking patterns!"],
      recommendations: ["Try a quick 10-rep session to get started"]
    };
  }
  
  // Count exercises
  const exerciseCounts = {};
  let totalReps = 0;
  
  workouts.forEach(w => {
    exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
    totalReps += w.reps || 0;
  });
  
  const favoriteExercise = Object.entries(exerciseCounts)
    .reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
  
  const averageReps = Math.round(totalReps / workouts.length);
  
  // Determine consistency
  let consistency = 'building';
  if (workouts.length >= 30) consistency = 'legendary';
  else if (workouts.length >= 14) consistency = 'dedicated';
  else if (workouts.length >= 7) consistency = 'consistent';
  else if (workouts.length >= 3) consistency = 'building';
  else consistency = 'starting';
  
  // Generate insights
  const insights = [];
  const recommendations = [];
  
  if (favoriteExercise !== 'none') {
    insights.push(`Your go-to exercise is ${EXERCISES[favoriteExercise]?.name || favoriteExercise}`);
  }
  
  if (averageReps > 15) {
    insights.push("You're pushing yourself with high rep counts!");
  } else if (averageReps < 10) {
    recommendations.push("Try increasing your rep count gradually");
  }
  
  // Check variety
  const exerciseVariety = Object.keys(exerciseCounts).length;
  if (exerciseVariety < 3) {
    recommendations.push("Mix up your routine with different exercises");
  } else {
    insights.push("Great exercise variety!");
  }
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    totalWorkouts: workouts.length,
    favoriteExercise,
    averageReps,
    consistency,
    trend: workouts.length > 5 ? 'improving' : 'building',
    insights,
    recommendations
  };
}

/**
 * Get complete coaching session
 */
async function getCoachingSession(userData, quests = []) {
  const [recommendations, predictions, motivation, questSuggestions] = await Promise.all([
    getWorkoutRecommendations(userData),
    getPerformancePrediction(userData),
    getMotivationalCoaching(userData, 'daily'),
    getQuestSuggestions(userData, quests)
  ]);
  
  const patterns = analyzeWorkoutPatterns(userData.recentWorkouts || []);
  
  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    recommendations,
    predictions,
    motivation,
    questSuggestions,
    patterns
  };
}

module.exports = {
  getWorkoutRecommendations,
  getPerformancePrediction,
  getMotivationalCoaching,
  getQuestSuggestions,
  analyzeWorkoutPatterns,
  getCoachingSession
};

