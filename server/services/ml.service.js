/**
 * Machine Learning Service for ForgeArena
 * 
 * This service provides AI-powered fitness coaching using:
 * 1. Google Gemini API (FREE tier: 15 req/min, 1M tokens/month)
 * 2. Rule-based recommendation engine (always free, no API needed)
 * 3. Statistical pattern analysis (local processing)
 * 
 * Features:
 * - Personalized workout recommendations
 * - Performance predictions and insights
 * - Motivational coaching based on user patterns
 * - Quest suggestions based on user stats
 * 
 * The system works completely FREE without any API key,
 * but can be enhanced with Google Gemini for more natural responses.
 */

const logger = require('../utils/logger');

// Google Gemini API (FREE tier - 15 requests/minute, 1M tokens/month)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Query Google Gemini API for enhanced AI responses
 * FREE tier: 15 requests/minute, 1,500 requests/day, 1M tokens/month
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string|null>} - The AI response or null if unavailable
 */
async function queryGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // No API key - use rule-based system (still works great!)
    return null;
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.warn('Gemini API error, using rule-based system', { 
        status: response.status,
        error: errorData.error?.message 
      });
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      logger.debug('Gemini response received', { length: text.length });
      return text;
    }
    
    return null;
  } catch (error) {
    logger.debug('Gemini not available, using intelligent fallback', { error: error.message });
    return null;
  }
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
function parseGeminiJSON(response) {
  if (!response) return null;
  
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try to find raw JSON object
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    
    // Try parsing the whole response
    return JSON.parse(response);
  } catch (error) {
    logger.debug('Failed to parse Gemini JSON response');
    return null;
  }
}

// ============================================================================
// INTELLIGENT RULE-BASED ML ENGINE (Always Free!)
// ============================================================================

/**
 * Calculates the optimal exercise based on user's stat distribution
 * Uses weighted scoring algorithm
 */
function calculateOptimalExercise(avatar) {
  const stats = {
    strength: avatar.strength || 10,
    endurance: avatar.endurance || 10,
    agility: avatar.agility || 10
  };
  
  const total = stats.strength + stats.endurance + stats.agility;
  const avg = total / 3;
  
  // Find the stat that needs the most improvement
  const statDeficits = {
    strength: avg - stats.strength,
    endurance: avg - stats.endurance,
    agility: avg - stats.agility
  };
  
  // Map stats to exercises
  const exerciseMap = {
    strength: ['pushup', 'pullup'],
    endurance: ['run', 'squat'],
    agility: ['squat', 'run']
  };
  
  // Find weakest stat
  const weakestStat = Object.entries(statDeficits)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  const exercises = exerciseMap[weakestStat];
  const primaryExercise = exercises[Math.floor(Math.random() * exercises.length)];
  
  return {
    exercise: primaryExercise,
    focusStat: weakestStat,
    deficit: statDeficits[weakestStat]
  };
}

/**
 * Calculates recommended reps based on user level and history
 */
function calculateOptimalReps(avatar, exercise, recentWorkouts = []) {
  const baseReps = {
    squat: 15,
    pushup: 12,
    pullup: 8,
    run: 5  // minutes or laps
  };
  
  const base = baseReps[exercise] || 10;
  const levelBonus = Math.floor(avatar.level * 1.5);
  
  // Check recent performance for this exercise
  const recentOfType = recentWorkouts.filter(w => w.exercise === exercise);
  let performanceAdjust = 0;
  
  if (recentOfType.length > 0) {
    const avgReps = recentOfType.reduce((sum, w) => sum + w.reps, 0) / recentOfType.length;
    // Suggest slightly more than average to promote growth
    performanceAdjust = Math.floor(avgReps * 0.1);
  }
  
  return Math.min(base + levelBonus + performanceAdjust, 100); // Cap at 100
}

/**
 * Generates personalized workout recommendations
 * Uses Gemini AI when available, falls back to rule-based system
 */
async function getWorkoutRecommendations(userData) {
  const { username, avatar, workoutStreak, lastWorkout, recentWorkouts = [] } = userData;
  
  logger.info('Generating ML workout recommendation', { 
    userId: username, 
    level: avatar.level,
    streak: workoutStreak 
  });

  // Try Gemini first for enhanced recommendations
  const geminiPrompt = `You are ForgeMaster, an AI fitness coach for a gamified fitness app called ForgeArena. 
Users have avatars that level up with workouts. Use RPG terminology like "XP", "level up", "stats".

User Profile:
- Username: ${username}
- Level: ${avatar.level}
- Stats: Strength ${avatar.strength}, Endurance ${avatar.endurance}, Agility ${avatar.agility}
- Workout Streak: ${workoutStreak} days
- Recent Workouts: ${recentWorkouts.length > 0 ? recentWorkouts.slice(0, 3).map(w => `${w.exercise}: ${w.reps} reps`).join(', ') : 'None yet'}

Recommend the best workout. Respond ONLY with valid JSON (no markdown):
{
  "primaryRecommendation": { "exercise": "squat|pushup|pullup|run", "reps": number, "reason": "brief reason" },
  "alternativeWorkouts": [{ "exercise": "string", "reps": number }],
  "motivationalTip": "encouraging message with emoji",
  "predictedXP": number,
  "focusArea": "strength|endurance|agility"
}`;

  const geminiResponse = await queryGemini(geminiPrompt);
  const parsedResponse = parseGeminiJSON(geminiResponse);
  
  if (parsedResponse && parsedResponse.primaryRecommendation) {
    logger.info('Using Gemini AI recommendation', { userId: username });
    return {
      success: true,
      source: 'gemini_ai',
      generatedAt: new Date().toISOString(),
      ...parsedResponse,
      userStats: {
        level: avatar.level,
        strength: avatar.strength,
        endurance: avatar.endurance,
        agility: avatar.agility
      }
    };
  }

  // Fallback to rule-based system
  const optimal = calculateOptimalExercise(avatar);
  const reps = calculateOptimalReps(avatar, optimal.exercise, recentWorkouts);
  
  // Generate contextual reason
  const reasons = {
    strength: [
      `Your strength (${avatar.strength}) could use a boost! This will help you hit harder.`,
      `Building strength will make you unstoppable in duels!`,
      `Warriors need strong arms - let's pump those numbers up!`
    ],
    endurance: [
      `Your endurance (${avatar.endurance}) needs work for those long raid battles!`,
      `Better endurance means longer workout streaks and more XP!`,
      `Stamina is key to becoming a legendary warrior!`
    ],
    agility: [
      `Your agility (${avatar.agility}) could be sharper for quick victories!`,
      `Swift warriors dodge more attacks - let's work on that speed!`,
      `Agility helps you complete quests faster!`
    ]
  };
  
  const reasonList = reasons[optimal.focusStat];
  const reason = reasonList[Math.floor(Math.random() * reasonList.length)];
  
  // Calculate alternative workouts
  const allExercises = ['squat', 'pushup', 'pullup', 'run'];
  const alternatives = allExercises
    .filter(e => e !== optimal.exercise)
    .slice(0, 2)
    .map(exercise => ({
      exercise,
      reps: calculateOptimalReps(avatar, exercise, recentWorkouts)
    }));
  
  // Streak-based motivation
  let motivationalTip;
  if (workoutStreak === 0) {
    motivationalTip = "🔥 Start your streak today! Every journey begins with a single rep!";
  } else if (workoutStreak < 3) {
    motivationalTip = `🔥 ${workoutStreak}-day streak! Keep it going to unlock streak bonuses!`;
  } else if (workoutStreak < 7) {
    motivationalTip = `🔥 ${workoutStreak}-day streak! You're on fire! Push for that 7-day milestone!`;
  } else {
    motivationalTip = `🔥 LEGENDARY ${workoutStreak}-day streak! You're an inspiration to the arena!`;
  }
  
  // Check if it's been a while since last workout
  if (lastWorkout) {
    const daysSince = Math.floor((Date.now() - new Date(lastWorkout).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 3) {
      motivationalTip = "💪 Welcome back, warrior! The arena missed you. Let's ease back in!";
    }
  }

  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    primaryRecommendation: {
      exercise: optimal.exercise,
      reps: reps,
      reason: reason
    },
    alternativeWorkouts: alternatives,
    motivationalTip,
    predictedXP: reps * 2,
    focusArea: optimal.focusStat,
    userStats: {
      level: avatar.level,
      strength: avatar.strength,
      endurance: avatar.endurance,
      agility: avatar.agility
    }
  };
}

/**
 * Generates performance predictions using Gemini or statistical analysis
 */
async function getPerformancePrediction(userData) {
  const { username, avatar, workoutStreak, recentWorkouts = [] } = userData;
  
  logger.info('Generating ML performance prediction', { userId: username });

  // Try Gemini for enhanced predictions
  const geminiPrompt = `You are ForgeMaster, an AI analyst for ForgeArena fitness app.
Analyze this warrior's progress and predict their performance.

User Data:
- Level: ${avatar.level} (${avatar.xp} XP, need ${avatar.level * 100 - avatar.xp} more for next level)
- Stats: Strength ${avatar.strength}, Endurance ${avatar.endurance}, Agility ${avatar.agility}
- Current Streak: ${workoutStreak} days
- Recent Workouts: ${recentWorkouts.length}

Respond ONLY with valid JSON (no markdown):
{
  "levelUpPrediction": { "daysUntil": number, "confidence": "high|medium|low" },
  "streakAnalysis": { "status": "string with emoji", "recommendation": "string" },
  "statsFocus": { "strongest": "strength|endurance|agility", "needsWork": "strength|endurance|agility", "tip": "string" },
  "weeklyGoal": { "exercise": "string", "target": number, "xpReward": number },
  "motivationalMessage": "inspiring quote"
}`;

  const geminiResponse = await queryGemini(geminiPrompt);
  const parsedResponse = parseGeminiJSON(geminiResponse);
  
  if (parsedResponse && parsedResponse.levelUpPrediction) {
    logger.info('Using Gemini AI prediction', { userId: username });
    return {
      success: true,
      source: 'gemini_ai',
      generatedAt: new Date().toISOString(),
      levelUpPrediction: {
        currentLevel: avatar.level,
        currentXP: avatar.xp,
        xpNeeded: avatar.level * 100 - avatar.xp,
        ...parsedResponse.levelUpPrediction
      },
      streakAnalysis: {
        currentStreak: workoutStreak,
        ...parsedResponse.streakAnalysis
      },
      ...parsedResponse
    };
  }

  // Fallback to rule-based predictions
  const xpNeeded = avatar.level * 100 - avatar.xp;
  let avgXPPerWorkout = 30;
  if (recentWorkouts.length > 0) {
    avgXPPerWorkout = recentWorkouts.reduce((sum, w) => sum + (w.reps * 2), 0) / recentWorkouts.length;
  }
  
  const workoutsToLevel = Math.ceil(xpNeeded / avgXPPerWorkout);
  const daysToLevel = Math.ceil(workoutsToLevel / (workoutStreak > 0 ? 1 : 0.5));
  const confidence = recentWorkouts.length >= 10 ? 'high' : 
                     recentWorkouts.length >= 5 ? 'medium' : 'low';
  
  const stats = { 
    strength: avatar.strength, 
    endurance: avatar.endurance, 
    agility: avatar.agility 
  };
  const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  
  let streakStatus, streakRecommendation;
  if (workoutStreak === 0) {
    streakStatus = 'No active streak';
    streakRecommendation = 'Start your journey today! Even 10 reps counts!';
  } else if (workoutStreak < 3) {
    streakStatus = `${workoutStreak}-day streak building`;
    streakRecommendation = 'Keep going! 3-day streaks unlock bonus XP!';
  } else if (workoutStreak < 7) {
    streakStatus = `${workoutStreak}-day streak active! 🔥`;
    streakRecommendation = 'Amazing progress! 7-day milestone is within reach!';
  } else if (workoutStreak < 30) {
    streakStatus = `${workoutStreak}-day streak! 🔥🔥`;
    streakRecommendation = 'Legendary dedication! You\'re in the top tier of warriors!';
  } else {
    streakStatus = `${workoutStreak}-day LEGENDARY streak! 🔥🔥🔥`;
    streakRecommendation = 'You are a true ForgeArena champion! Keep inspiring others!';
  }
  
  const weeklyExercise = sortedStats[2][0] === 'strength' ? 'pushup' :
                         sortedStats[2][0] === 'endurance' ? 'run' : 'squat';
  const weeklyTarget = 50 + (avatar.level * 10);
  
  const motivationalMessages = [
    `Level ${avatar.level + 1} is just ${xpNeeded} XP away - you've got this!`,
    `Your ${sortedStats[0][0]} is your superpower! Keep building on it!`,
    `Every workout brings you closer to legendary status!`,
    `The arena sees your dedication. Champions are made one rep at a time!`
  ];

  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    levelUpPrediction: {
      currentLevel: avatar.level,
      currentXP: avatar.xp,
      xpNeeded: xpNeeded,
      estimatedWorkouts: workoutsToLevel,
      daysUntil: daysToLevel,
      confidence: confidence
    },
    streakAnalysis: {
      currentStreak: workoutStreak,
      status: streakStatus,
      recommendation: streakRecommendation
    },
    statsFocus: {
      strongest: sortedStats[0][0],
      strongestValue: sortedStats[0][1],
      needsWork: sortedStats[2][0],
      needsWorkValue: sortedStats[2][1],
      tip: `Focus on ${sortedStats[2][0]} exercises to become a well-rounded warrior!`
    },
    weeklyGoal: {
      exercise: weeklyExercise,
      target: weeklyTarget,
      xpReward: weeklyTarget * 2,
      description: `Complete ${weeklyTarget} ${weeklyExercise}s this week!`
    },
    motivationalMessage: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  };
}

/**
 * Generates contextual motivational coaching using Gemini or rule-based system
 */
async function getMotivationalCoaching(userData, context = 'daily') {
  const { username, avatar, workoutStreak } = userData;
  
  logger.info('Generating ML motivational coaching', { userId: username, context });

  // Try Gemini for personalized motivation
  const contextDescriptions = {
    daily: 'Give a daily motivational message to start their workout.',
    streak_broken: 'Their streak was broken. Encourage them to start fresh.',
    level_up: 'They just leveled up! Celebrate their achievement.',
    quest_complete: 'They completed a quest! Acknowledge their accomplishment.',
    new_user: 'They are new to ForgeArena. Welcome them warmly.',
    comeback: 'They haven\'t worked out in a while. Welcome them back.'
  };

  const geminiPrompt = `You are ForgeMaster, the legendary AI coach of ForgeArena.
Speak like a wise but fun RPG mentor. Use emojis effectively.

Warrior: ${username}
Level: ${avatar.level}
Streak: ${workoutStreak} days
Context: ${contextDescriptions[context] || contextDescriptions.daily}

Respond ONLY with valid JSON (no markdown):
{
  "message": "motivational message under 100 words",
  "emoji": "single relevant emoji",
  "actionPrompt": "what they should do next"
}`;

  const geminiResponse = await queryGemini(geminiPrompt);
  const parsedResponse = parseGeminiJSON(geminiResponse);
  
  if (parsedResponse && parsedResponse.message) {
    logger.info('Using Gemini AI motivation', { userId: username, context });
    return {
      success: true,
      source: 'gemini_ai',
      generatedAt: new Date().toISOString(),
      context,
      ...parsedResponse,
      userLevel: avatar.level,
      currentStreak: workoutStreak
    };
  }

  // Fallback to rule-based motivation
  const greetings = ['Warrior', 'Champion', 'Hero', 'Legend'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  const contextResponses = {
    daily: {
      messages: [
        `Rise and conquer, ${greeting} ${username}! Your Level ${avatar.level} avatar is ready for battle!`,
        `The forge awaits, ${username}! Every rep shapes your destiny today!`,
        `Good to see you, ${greeting}! The leaderboard trembles at your dedication!`,
        `${username}, your avatar grows stronger with each workout. Let's earn some XP!`
      ],
      emoji: '⚔️',
      actionPrompt: 'Log your first workout of the day!'
    },
    streak_broken: {
      messages: [
        `Welcome back, ${username}! Every legend faces setbacks. What matters is you're here now!`,
        `The arena welcomes your return, ${greeting}! A new streak begins today!`,
        `${username}, even the mightiest warriors rest. Now let's forge a new path!`,
        `Your avatar missed you! Let's start fresh and build something legendary!`
      ],
      emoji: '🔥',
      actionPrompt: 'Start a new streak with a quick workout!'
    },
    level_up: {
      messages: [
        `🎉 LEVEL UP! ${username} has reached Level ${avatar.level}! The arena celebrates your power!`,
        `⬆️ LEGENDARY! You've ascended to Level ${avatar.level}! New challenges await!`,
        `🏆 ${greeting} ${username} grows stronger! Level ${avatar.level} unlocked!`,
        `✨ The forge glows bright! ${username} has achieved Level ${avatar.level}!`
      ],
      emoji: '⬆️',
      actionPrompt: 'Check out new quests available at your level!'
    },
    quest_complete: {
      messages: [
        `Quest conquered! ${username} proves their worth once again!`,
        `Victory! The XP flows through you, ${greeting}!`,
        `Another quest falls before ${username}'s might! Well done!`,
        `${greeting} ${username} completes another challenge! The arena cheers!`
      ],
      emoji: '✅',
      actionPrompt: 'Take on your next challenge!'
    },
    new_user: {
      messages: [
        `Welcome to ForgeArena, ${username}! Your legendary journey begins now!`,
        `A new warrior enters the arena! ${username}, your avatar awaits your command!`,
        `Greetings, ${username}! The forge is ready to shape your destiny!`,
        `${username} joins the battle! Every workout will evolve your avatar!`
      ],
      emoji: '🏰',
      actionPrompt: 'Complete your first workout to begin your journey!'
    },
    comeback: {
      messages: [
        `The arena has missed you, ${username}! Your avatar is eager to train!`,
        `Welcome back, ${greeting}! The forge kept your equipment warm!`,
        `${username} returns! The leaderboard awaits your climb!`,
        `Long time no see, warrior! Let's get back in fighting shape!`
      ],
      emoji: '💪',
      actionPrompt: 'Log a workout to restart your journey!'
    }
  };

  const response = contextResponses[context] || contextResponses.daily;
  const message = response.messages[Math.floor(Math.random() * response.messages.length)];

  let bonusInfo = '';
  if (workoutStreak > 0 && context === 'daily') {
    bonusInfo = ` 🔥 ${workoutStreak}-day streak active!`;
  }

  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    context,
    message: message + bonusInfo,
    emoji: response.emoji,
    actionPrompt: response.actionPrompt,
    userLevel: avatar.level,
    currentStreak: workoutStreak
  };
}

/**
 * Suggests optimal quests based on user's stats and progress
 */
async function getQuestSuggestions(userData, availableQuests = []) {
  const { username, avatar } = userData;
  
  logger.info('Generating ML quest suggestions', { userId: username });

  const incompleteQuests = availableQuests.filter(q => !q.completed);
  
  if (incompleteQuests.length === 0) {
    return {
      success: true,
      source: 'forgemaster_ai',
      generatedAt: new Date().toISOString(),
      topQuest: null,
      questOrder: [],
      strategyTip: 'All quests completed! You are a true champion! Check back later for new challenges!',
      completionRate: 100
    };
  }

  // Score each quest based on multiple factors
  const scoredQuests = incompleteQuests.map(quest => {
    let score = 0;
    
    // Factor 1: XP efficiency (lower XP = easier to complete first)
    const xpScore = 100 - (quest.xpReward / 10);
    score += xpScore * 0.3;
    
    // Factor 2: Progress (if quest has progress, prioritize near-complete ones)
    if (quest.progress) {
      const [current, total] = quest.progress.split('/').map(Number);
      const progressPercent = (current / total) * 100;
      score += progressPercent * 0.4;
    }
    
    // Factor 3: Level appropriateness
    const levelDiff = Math.abs(avatar.level - (quest.xpReward / 50));
    score += Math.max(0, 50 - levelDiff * 10) * 0.3;
    
    return { ...quest, score };
  });

  scoredQuests.sort((a, b) => b.score - a.score);
  
  const topQuest = scoredQuests[0];
  
  const strategyTips = [
    `"${topQuest.title}" aligns perfectly with your current level!`,
    `Start with "${topQuest.title}" for quick XP gains!`,
    `Your stats suggest "${topQuest.title}" is your best next move!`,
    `Completing "${topQuest.title}" will boost your momentum!`
  ];

  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    topQuest: {
      id: topQuest.id,
      title: topQuest.title,
      xpReward: topQuest.xpReward,
      reason: strategyTips[Math.floor(Math.random() * strategyTips.length)],
      score: Math.round(topQuest.score)
    },
    questOrder: scoredQuests.map(q => ({
      id: q.id,
      title: q.title,
      score: Math.round(q.score)
    })),
    strategyTip: `Focus on quests that match your Level ${avatar.level} abilities for maximum efficiency!`,
    completionRate: Math.round((availableQuests.filter(q => q.completed).length / availableQuests.length) * 100)
  };
}

/**
 * Analyzes workout patterns using statistical methods
 * This is LOCAL ML - no API needed, 100% FREE
 */
function analyzeWorkoutPatterns(workoutHistory = []) {
  logger.info('Analyzing workout patterns', { historySize: workoutHistory.length });

  if (workoutHistory.length === 0) {
    return {
      success: true,
      source: 'forgemaster_ai',
      totalWorkouts: 0,
      favoriteExercise: null,
      averageReps: 0,
      consistency: 'new_user',
      trend: 'starting',
      insights: [
        '🆕 Welcome to ForgeArena! Start logging workouts to unlock personalized insights.',
        '💡 Tip: Try different exercises to find what you enjoy most!',
        '🎯 Your first workout will set the foundation for your avatar\'s growth!'
      ],
      recommendations: ['Log your first workout to begin your journey!']
    };
  }

  // Exercise frequency analysis
  const exerciseCounts = {};
  const exerciseReps = {};
  let totalReps = 0;
  
  workoutHistory.forEach(workout => {
    const exercise = workout.exercise || 'unknown';
    exerciseCounts[exercise] = (exerciseCounts[exercise] || 0) + 1;
    exerciseReps[exercise] = (exerciseReps[exercise] || 0) + (workout.reps || 0);
    totalReps += workout.reps || 0;
  });

  const sortedExercises = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1]);
  const favoriteExercise = sortedExercises[0]?.[0] || null;
  const leastDoneExercise = sortedExercises[sortedExercises.length - 1]?.[0] || null;

  const avgReps = Math.round(totalReps / workoutHistory.length);
  
  const consistency = workoutHistory.length >= 30 ? 'legendary' :
                      workoutHistory.length >= 20 ? 'dedicated' :
                      workoutHistory.length >= 10 ? 'consistent' :
                      workoutHistory.length >= 5 ? 'building' : 'starting';

  let trend = 'stable';
  if (workoutHistory.length >= 6) {
    const recentHalf = workoutHistory.slice(0, Math.floor(workoutHistory.length / 2));
    const olderHalf = workoutHistory.slice(Math.floor(workoutHistory.length / 2));
    
    const recentAvg = recentHalf.reduce((sum, w) => sum + (w.reps || 0), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, w) => sum + (w.reps || 0), 0) / olderHalf.length;
    
    if (recentAvg > olderAvg * 1.1) trend = 'improving';
    else if (recentAvg < olderAvg * 0.9) trend = 'declining';
  }

  const insights = [];
  
  if (favoriteExercise) {
    insights.push(`💪 Your go-to exercise is ${favoriteExercise} (${exerciseCounts[favoriteExercise]} sessions)!`);
  }
  
  if (avgReps > 25) {
    insights.push('🔥 Impressive rep counts! You\'re pushing your limits!');
  } else if (avgReps > 15) {
    insights.push('📈 Solid workout volume! Consider pushing for higher reps for more XP.');
  } else {
    insights.push('💡 Try increasing your reps gradually for faster leveling!');
  }

  const exerciseTypes = Object.keys(exerciseCounts).length;
  if (exerciseTypes < 2) {
    insights.push('🎯 Try mixing in different exercises for balanced avatar stats!');
  } else if (exerciseTypes >= 4) {
    insights.push('⚖️ Great exercise variety! Your avatar is well-rounded!');
  }

  if (trend === 'improving') {
    insights.push('📈 Your performance is trending upward! Keep the momentum!');
  } else if (trend === 'declining') {
    insights.push('💪 Time to push harder! Your avatar believes in you!');
  }

  const recommendations = [];
  
  if (leastDoneExercise && leastDoneExercise !== favoriteExercise) {
    recommendations.push(`Try more ${leastDoneExercise} to balance your training!`);
  }
  
  if (consistency === 'starting' || consistency === 'building') {
    recommendations.push('Aim for daily workouts to build a strong streak!');
  }
  
  if (avgReps < 20) {
    recommendations.push('Challenge yourself with 5 more reps each session!');
  }

  return {
    success: true,
    source: 'forgemaster_ai',
    generatedAt: new Date().toISOString(),
    totalWorkouts: workoutHistory.length,
    totalReps,
    favoriteExercise,
    averageReps: avgReps,
    consistency,
    trend,
    exerciseDistribution: exerciseCounts,
    exerciseTotalReps: exerciseReps,
    insights,
    recommendations
  };
}

/**
 * Generates a complete AI coaching session
 * Combines all ML features for a comprehensive response
 */
async function getCoachingSession(userData, availableQuests = []) {
  logger.info('Generating complete ML coaching session', { userId: userData.username });

  const [recommendations, predictions, motivation, questSuggestions, patterns] = await Promise.all([
    getWorkoutRecommendations(userData),
    getPerformancePrediction(userData),
    getMotivationalCoaching(userData, 'daily'),
    getQuestSuggestions(userData, availableQuests),
    Promise.resolve(analyzeWorkoutPatterns(userData.recentWorkouts || []))
  ]);

  return {
    success: true,
    source: recommendations.source, // Will be 'gemini_ai' or 'forgemaster_ai'
    generatedAt: new Date().toISOString(),
    sessionId: `session_${Date.now()}`,
    greeting: motivation,
    workoutPlan: recommendations,
    predictions,
    questStrategy: questSuggestions,
    patternAnalysis: patterns,
    summary: {
      todaysFocus: recommendations.focusArea,
      primaryExercise: recommendations.primaryRecommendation,
      daysToLevelUp: predictions.levelUpPrediction.daysUntil,
      topQuest: questSuggestions.topQuest
    }
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
