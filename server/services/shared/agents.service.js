/**
 * AI Agents Service for ForgeArena
 * 
 * Implements a multi-agent system where specialized AI agents collaborate
 * to provide enhanced fitness coaching and automation.
 * 
 * Agents:
 * 1. Training Strategist Agent - Creates personalized workout plans
 * 2. Motivation Coach Agent - Generates contextual motivation
 * 3. Progress Analyst Agent - Evaluates user progress and trends
 * 4. Goal Coordinator Agent - Orchestrates agents and takes actions
 * 
 * These agents work together to:
 * - Analyze user data holistically
 * - Make automated decisions (set goals, adjust difficulty)
 * - Generate personalized content
 * - Take action on behalf of users (update database)
 * 
 * ENHANCED WITH GOOGLE GEMINI (FREE TIER):
 * - 15 requests/minute, 1,500 requests/day
 * - Falls back to rule-based if API unavailable
 */

const logger = require('../../utils/logger');
const geminiService = require('./gemini.service');

// =============================================================================
// Agent Base Class
// =============================================================================

class Agent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
    this.lastExecution = null;
    this.executionCount = 0;
  }

  log(message, metadata = {}) {
    logger.info(`[Agent:${this.name}] ${message}`, {
      agent: this.name,
      role: this.role,
      ...metadata
    });
  }

  async execute(context) {
    this.lastExecution = new Date();
    this.executionCount++;
    throw new Error('Execute method must be implemented by subclass');
  }

  getStats() {
    return {
      name: this.name,
      role: this.role,
      lastExecution: this.lastExecution,
      executionCount: this.executionCount
    };
  }
}

// =============================================================================
// Training Strategist Agent
// =============================================================================

class TrainingStrategistAgent extends Agent {
  constructor() {
    super('TrainingStrategist', 'Creates personalized workout plans and training strategies');
    
    // Exercise database with detailed info
    this.exercises = {
      squat: { 
        name: 'Squats', 
        primaryStat: 'agility', 
        secondaryStat: 'endurance',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        difficulty: 'beginner',
        xpPerRep: 2
      },
      pushup: { 
        name: 'Push-ups', 
        primaryStat: 'strength', 
        secondaryStat: 'endurance',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        difficulty: 'beginner',
        xpPerRep: 2
      },
      pullup: { 
        name: 'Pull-ups', 
        primaryStat: 'strength', 
        secondaryStat: 'agility',
        muscleGroups: ['back', 'biceps', 'forearms'],
        difficulty: 'intermediate',
        xpPerRep: 3
      },
      run: { 
        name: 'Running', 
        primaryStat: 'endurance', 
        secondaryStat: 'agility',
        muscleGroups: ['cardiovascular', 'legs'],
        difficulty: 'beginner',
        xpPerRep: 1
      },
      plank: {
        name: 'Plank (seconds)',
        primaryStat: 'endurance',
        secondaryStat: 'strength',
        muscleGroups: ['core', 'shoulders'],
        difficulty: 'beginner',
        xpPerRep: 1
      },
      burpee: {
        name: 'Burpees',
        primaryStat: 'endurance',
        secondaryStat: 'agility',
        muscleGroups: ['full-body'],
        difficulty: 'advanced',
        xpPerRep: 4
      }
    };

    // Training templates by goal
    this.trainingTemplates = {
      strength: ['pushup', 'pullup', 'plank'],
      endurance: ['run', 'burpee', 'squat'],
      agility: ['squat', 'burpee', 'run'],
      balanced: ['pushup', 'squat', 'run', 'plank']
    };
  }

  async execute(context) {
    await super.execute(context);
    const { userData, recentWorkouts = [], goals = {} } = context;
    
    this.log('Analyzing user profile for training strategy', { userId: userData.username });

    // Analyze current stats
    const stats = {
      strength: userData.avatar?.strength || 10,
      endurance: userData.avatar?.endurance || 10,
      agility: userData.avatar?.agility || 10
    };

    // Identify weakest and strongest stats
    const sortedStats = Object.entries(stats).sort((a, b) => a[1] - b[1]);
    const weakestStat = sortedStats[0][0];
    const strongestStat = sortedStats[sortedStats.length - 1][0];
    const avgStat = Math.round((stats.strength + stats.endurance + stats.agility) / 3);

    // Analyze recent workout patterns
    const workoutFrequency = this.analyzeWorkoutFrequency(recentWorkouts);
    const favoriteExercise = this.getFavoriteExercise(recentWorkouts);
    const muscleGroupBalance = this.analyzeMuscleGroupBalance(recentWorkouts);

    // Determine training focus based on user level and imbalances
    const level = userData.avatar?.level || 1;
    const trainingFocus = this.determineTrainingFocus(stats, level, workoutFrequency);

    // Generate personalized workout plan
    const weeklyPlan = this.generateWeeklyPlan(stats, level, trainingFocus, recentWorkouts);

    // Calculate optimal rep ranges
    const repRanges = this.calculateRepRanges(level, stats, workoutFrequency);

    // Generate strategy recommendations
    const strategyRecommendations = this.generateStrategyRecommendations(
      stats, level, workoutFrequency, muscleGroupBalance
    );

    // Try to get Gemini-enhanced insight
    let geminiInsight = null;
    if (geminiService.isGeminiAvailable()) {
      try {
        geminiInsight = await geminiService.generateStrategyInsight(userData, weeklyPlan);
      } catch (error) {
        this.log('Gemini strategy insight failed, using rule-based', { error: error.message });
      }
    }

    return {
      agent: this.name,
      aiEnhanced: !!geminiInsight,
      analysis: {
        currentStats: stats,
        weakestStat,
        strongestStat,
        avgStat,
        level,
        workoutFrequency,
        favoriteExercise,
        muscleGroupBalance
      },
      trainingFocus,
      weeklyPlan,
      repRanges,
      strategyRecommendations,
      geminiInsight,
      generatedAt: new Date().toISOString()
    };
  }

  analyzeWorkoutFrequency(workouts) {
    if (workouts.length === 0) return { workoutsPerWeek: 0, consistency: 'new' };

    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = workouts.filter(w => new Date(w.timestamp || w.date) > oneWeekAgo).length;
    const lastWeek = workouts.filter(w => {
      const date = new Date(w.timestamp || w.date);
      return date > twoWeeksAgo && date <= oneWeekAgo;
    }).length;

    let consistency = 'new';
    if (thisWeek >= 5) consistency = 'excellent';
    else if (thisWeek >= 3) consistency = 'good';
    else if (thisWeek >= 1) consistency = 'building';
    else if (lastWeek > 0) consistency = 'returning';

    return {
      workoutsPerWeek: thisWeek,
      lastWeekWorkouts: lastWeek,
      consistency,
      trend: thisWeek > lastWeek ? 'improving' : thisWeek < lastWeek ? 'declining' : 'stable'
    };
  }

  getFavoriteExercise(workouts) {
    if (workouts.length === 0) return null;
    
    const counts = {};
    workouts.forEach(w => {
      counts[w.exercise] = (counts[w.exercise] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : null;
  }

  analyzeMuscleGroupBalance(workouts) {
    const muscleGroupCounts = {};
    
    workouts.forEach(w => {
      const exercise = this.exercises[w.exercise];
      if (exercise) {
        exercise.muscleGroups.forEach(mg => {
          muscleGroupCounts[mg] = (muscleGroupCounts[mg] || 0) + (w.reps || 1);
        });
      }
    });

    const total = Object.values(muscleGroupCounts).reduce((a, b) => a + b, 0) || 1;
    const balance = {};
    Object.entries(muscleGroupCounts).forEach(([mg, count]) => {
      balance[mg] = Math.round((count / total) * 100);
    });

    return balance;
  }

  determineTrainingFocus(stats, level, workoutFrequency) {
    // New users focus on balanced training
    if (level < 3 || workoutFrequency.consistency === 'new') {
      return {
        primary: 'balanced',
        reason: 'Building a solid foundation with balanced training'
      };
    }

    // Calculate stat variance
    const values = Object.values(stats);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;

    // High variance = focus on weak stat
    if (variance > 25) {
      const weakest = Object.entries(stats).reduce((a, b) => a[1] < b[1] ? a : b)[0];
      return {
        primary: weakest,
        reason: `Focusing on ${weakest} to balance your stats`
      };
    }

    // Well-balanced users can specialize
    return {
      primary: 'balanced',
      reason: 'Maintaining excellent stat balance'
    };
  }

  generateWeeklyPlan(stats, level, trainingFocus, recentWorkouts) {
    const exercises = this.trainingTemplates[trainingFocus.primary] || this.trainingTemplates.balanced;
    const baseReps = 8 + Math.floor(level * 1.5);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = {};

    days.forEach((day, index) => {
      if (index === 6) {
        // Sunday = rest day
        plan[day] = { type: 'rest', exercises: [], reason: 'Recovery day for muscle growth' };
      } else {
        const dayExercises = [];
        const exerciseIndex = index % exercises.length;
        const primaryExercise = exercises[exerciseIndex];
        const secondaryExercise = exercises[(exerciseIndex + 1) % exercises.length];

        dayExercises.push({
          exercise: primaryExercise,
          name: this.exercises[primaryExercise]?.name || primaryExercise,
          sets: 3,
          reps: baseReps,
          xpPotential: baseReps * 3 * (this.exercises[primaryExercise]?.xpPerRep || 2)
        });

        dayExercises.push({
          exercise: secondaryExercise,
          name: this.exercises[secondaryExercise]?.name || secondaryExercise,
          sets: 2,
          reps: Math.floor(baseReps * 0.8),
          xpPotential: Math.floor(baseReps * 0.8) * 2 * (this.exercises[secondaryExercise]?.xpPerRep || 2)
        });

        plan[day] = {
          type: 'training',
          exercises: dayExercises,
          totalXpPotential: dayExercises.reduce((sum, e) => sum + e.xpPotential, 0)
        };
      }
    });

    return plan;
  }

  calculateRepRanges(level, stats, workoutFrequency) {
    const baseMin = 5 + Math.floor(level / 2);
    const baseMax = 15 + level;
    
    const intensityMultiplier = workoutFrequency.consistency === 'excellent' ? 1.2 :
                                workoutFrequency.consistency === 'good' ? 1.1 : 1.0;

    return {
      beginner: {
        min: baseMin,
        max: Math.floor(baseMax * 0.8),
        recommendation: 'Start here if returning from a break'
      },
      standard: {
        min: Math.floor(baseMin * intensityMultiplier),
        max: Math.floor(baseMax * intensityMultiplier),
        recommendation: 'Your optimal range for consistent progress'
      },
      challenge: {
        min: Math.floor(baseMin * intensityMultiplier * 1.3),
        max: Math.floor(baseMax * intensityMultiplier * 1.5),
        recommendation: 'Push yourself on strong days'
      }
    };
  }

  generateStrategyRecommendations(stats, level, workoutFrequency, muscleGroupBalance) {
    const recommendations = [];

    // Frequency recommendations
    if (workoutFrequency.consistency === 'new' || workoutFrequency.workoutsPerWeek < 3) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        message: 'Aim for at least 3 workouts per week to build consistency',
        action: 'Increase workout frequency'
      });
    }

    // Balance recommendations
    const weakest = Object.entries(stats).reduce((a, b) => a[1] < b[1] ? a : b);
    if (weakest[1] < 15 && level > 3) {
      const exerciseForStat = {
        strength: 'pushup',
        endurance: 'run',
        agility: 'squat'
      };
      recommendations.push({
        type: 'balance',
        priority: 'medium',
        message: `Your ${weakest[0]} (${weakest[1]}) is falling behind. Add more ${this.exercises[exerciseForStat[weakest[0]]]?.name || 'targeted exercises'}.`,
        action: `Focus on ${weakest[0]}-building exercises`
      });
    }

    // Recovery recommendations
    if (workoutFrequency.workoutsPerWeek >= 6) {
      recommendations.push({
        type: 'recovery',
        priority: 'medium',
        message: 'You\'re training hard! Make sure to take rest days for muscle recovery.',
        action: 'Schedule at least 1 rest day per week'
      });
    }

    // Level-up recommendations
    const xpToNext = (level * 100) - (stats.strength + stats.endurance + stats.agility);
    if (xpToNext < 50) {
      recommendations.push({
        type: 'milestone',
        priority: 'high',
        message: `You're close to leveling up! Just ${xpToNext} XP to go!`,
        action: 'Complete a few more exercises to reach the next level'
      });
    }

    return recommendations;
  }
}

// =============================================================================
// Motivation Coach Agent
// =============================================================================

class MotivationCoachAgent extends Agent {
  constructor() {
    super('MotivationCoach', 'Generates personalized, contextual motivational content');
    
    // Motivation templates by context
    this.motivationLibrary = {
      dailyStart: [
        { message: "Rise and grind, champion! Today's workout is waiting.", tone: 'energetic' },
        { message: "Every rep today is an investment in tomorrow's you.", tone: 'inspirational' },
        { message: "Your body can handle more than you think. Let's prove it!", tone: 'challenging' },
        { message: "Champions don't hit snooze. Time to train!", tone: 'energetic' },
        { message: "Small steps daily lead to giant leaps monthly.", tone: 'supportive' }
      ],
      streakCelebration: [
        { message: "{streak} days strong! You're building something incredible!", tone: 'celebratory' },
        { message: "Streak day {streak}! Your consistency is your superpower!", tone: 'celebratory' },
        { message: "{streak} days in a row! Most people quit by now. You're not most people.", tone: 'challenging' }
      ],
      streakRecovery: [
        { message: "Yesterday's miss doesn't define tomorrow's success. Start fresh now!", tone: 'supportive' },
        { message: "The best time to restart was yesterday. The second best time is now.", tone: 'inspirational' },
        { message: "Every champion has fallen. What makes them champions is getting back up.", tone: 'inspirational' }
      ],
      levelUp: [
        { message: "LEVEL UP! Level {level} unlocked! Your dedication is legendary!", tone: 'celebratory' },
        { message: "New level achieved! You're not the same person who started this journey.", tone: 'reflective' },
        { message: "Level {level} warrior! The forge is making you stronger!", tone: 'energetic' }
      ],
      pushHarder: [
        { message: "You've got more in the tank! Push through that comfort zone!", tone: 'challenging' },
        { message: "Pain is temporary. Pride is forever. Give it everything!", tone: 'challenging' },
        { message: "When your mind says stop, tell it to be quiet. You control this.", tone: 'intense' }
      ],
      recovery: [
        { message: "Rest is when muscles grow. You've earned this recovery.", tone: 'supportive' },
        { message: "Smart recovery is part of smart training. Recharge those batteries!", tone: 'educational' },
        { message: "Today we rest. Tomorrow we conquer. It's all part of the plan.", tone: 'strategic' }
      ],
      milestone: [
        { message: "You just hit {milestone}! This is what dedication looks like!", tone: 'celebratory' },
        { message: "Milestone unlocked: {milestone}! Remember how far you've come!", tone: 'reflective' },
        { message: "{milestone} achieved! Screenshot this moment - it's history!", tone: 'celebratory' }
      ]
    };
  }

  async execute(context) {
    await super.execute(context);
    const { userData, situationalContext = 'dailyStart', milestone = null } = context;
    
    this.log('Generating motivational content', { 
      userId: userData.username, 
      context: situationalContext 
    });

    const level = userData.avatar?.level || 1;
    const streak = userData.workoutStreak || 0;
    const username = userData.username || 'Champion';

    // Select appropriate motivation category
    let category = situationalContext;
    if (streak === 0 && category === 'dailyStart') {
      category = 'streakRecovery';
    } else if (streak >= 7 && category === 'dailyStart') {
      category = 'streakCelebration';
    }

    // Get messages from category
    const messages = this.motivationLibrary[category] || this.motivationLibrary.dailyStart;
    const selected = messages[Math.floor(Math.random() * messages.length)];

    // Personalize message
    let personalizedMessage = selected.message
      .replace('{streak}', streak)
      .replace('{level}', level)
      .replace('{username}', username)
      .replace('{milestone}', milestone || 'achievement');

    // Try to get Gemini-enhanced motivation
    let geminiMotivation = null;
    if (geminiService.isGeminiAvailable()) {
      try {
        geminiMotivation = await geminiService.generateMotivation(userData, category);
        if (geminiMotivation) {
          personalizedMessage = geminiMotivation;
        }
      } catch (error) {
        this.log('Gemini motivation failed, using rule-based', { error: error.message });
      }
    }

    // Generate additional encouragement based on user data
    const additionalEncouragement = this.generateAdditionalEncouragement(userData);

    // Generate call to action
    const callToAction = this.generateCallToAction(userData, situationalContext);

    return {
      agent: this.name,
      aiEnhanced: !!geminiMotivation,
      primaryMessage: personalizedMessage,
      tone: selected.tone,
      additionalEncouragement,
      callToAction,
      situationalContext: category,
      personalization: {
        usedStreak: streak > 0,
        usedLevel: true,
        usedUsername: true
      },
      generatedAt: new Date().toISOString()
    };
  }

  generateAdditionalEncouragement(userData) {
    const encouragements = [];
    const level = userData.avatar?.level || 1;
    const streak = userData.workoutStreak || 0;
    const stats = userData.avatar || {};

    // Streak-based encouragement
    if (streak >= 30) {
      encouragements.push("30+ day streak! You're in the top 1% of dedicated athletes!");
    } else if (streak >= 14) {
      encouragements.push("Two weeks strong! You're building an unbreakable habit!");
    } else if (streak >= 7) {
      encouragements.push("One full week! Habits are forming!");
    } else if (streak >= 3) {
      encouragements.push("Three days in! Keep going - day 7 is when it clicks!");
    }

    // Level-based encouragement
    if (level >= 20) {
      encouragements.push("Elite level achieved! You're an inspiration to others!");
    } else if (level >= 10) {
      encouragements.push("Double digits! Your progress is remarkable!");
    } else if (level >= 5) {
      encouragements.push("Halfway to double digits! You're growing stronger!");
    }

    // Stat-based encouragement
    const totalStats = (stats.strength || 0) + (stats.endurance || 0) + (stats.agility || 0);
    if (totalStats >= 100) {
      encouragements.push("100+ total stat points! You're becoming a true warrior!");
    }

    return encouragements.slice(0, 2); // Return max 2 encouragements
  }

  generateCallToAction(userData, context) {
    const actions = {
      dailyStart: [
        "Start your workout now!",
        "Begin today's training session",
        "Let's get those reps in!"
      ],
      streakCelebration: [
        "Keep the streak alive!",
        "Don't break the chain!",
        "Another day, another victory!"
      ],
      streakRecovery: [
        "Start a new streak today!",
        "Begin your comeback now!",
        "Day 1 of your new streak awaits!"
      ],
      levelUp: [
        "Push to the next level!",
        "Celebrate with a workout!",
        "Show off your new power!"
      ],
      pushHarder: [
        "Add 5 more reps!",
        "Challenge yourself!",
        "Beat your personal best!"
      ],
      recovery: [
        "Rest and recover",
        "Stretch and hydrate",
        "Prepare for tomorrow"
      ]
    };

    const categoryActions = actions[context] || actions.dailyStart;
    return categoryActions[Math.floor(Math.random() * categoryActions.length)];
  }
}

// =============================================================================
// Progress Analyst Agent
// =============================================================================

class ProgressAnalystAgent extends Agent {
  constructor() {
    super('ProgressAnalyst', 'Evaluates user progress, identifies trends, and provides insights');
  }

  async execute(context) {
    await super.execute(context);
    const { userData, recentWorkouts = [], historicalData = {} } = context;
    
    this.log('Analyzing user progress', { userId: userData.username });

    const level = userData.avatar?.level || 1;
    const xp = userData.avatar?.xp || 0;
    const stats = {
      strength: userData.avatar?.strength || 10,
      endurance: userData.avatar?.endurance || 10,
      agility: userData.avatar?.agility || 10
    };

    // Calculate various progress metrics
    const progressMetrics = this.calculateProgressMetrics(userData, recentWorkouts);
    const trends = this.analyzeTrends(recentWorkouts);
    const projections = this.calculateProjections(userData, trends);
    const achievements = this.identifyAchievements(userData, recentWorkouts);
    const areasForImprovement = this.identifyAreasForImprovement(userData, trends);
    const progressScore = this.calculateProgressScore(progressMetrics, trends);

    // Try to get Gemini-enhanced analysis
    let geminiAnalysis = null;
    if (geminiService.isGeminiAvailable()) {
      try {
        geminiAnalysis = await geminiService.generateProgressAnalysis(userData, {
          ...progressMetrics,
          trend: trends.overallTrend
        });
      } catch (error) {
        this.log('Gemini progress analysis failed, using rule-based', { error: error.message });
      }
    }

    return {
      agent: this.name,
      aiEnhanced: !!geminiAnalysis,
      progressMetrics,
      trends,
      projections,
      achievements,
      areasForImprovement,
      progressScore,
      summary: this.generateSummary(progressMetrics, trends, projections),
      geminiAnalysis,
      generatedAt: new Date().toISOString()
    };
  }

  calculateProgressMetrics(userData, workouts) {
    const level = userData.avatar?.level || 1;
    const xp = userData.avatar?.xp || 0;
    const xpForNextLevel = level * 100;
    const xpProgress = (xp % 100) / 100;

    // Calculate workout metrics
    const totalWorkouts = workouts.length;
    const totalReps = workouts.reduce((sum, w) => sum + (w.reps || 0), 0);
    const avgRepsPerWorkout = totalWorkouts > 0 ? Math.round(totalReps / totalWorkouts) : 0;

    // Calculate time-based metrics
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const thisWeekWorkouts = workouts.filter(w => new Date(w.timestamp || w.date) > oneWeekAgo);
    const lastWeekWorkouts = workouts.filter(w => {
      const date = new Date(w.timestamp || w.date);
      return date > twoWeeksAgo && date <= oneWeekAgo;
    });

    return {
      currentLevel: level,
      currentXP: xp,
      xpToNextLevel: xpForNextLevel - xp,
      levelProgress: Math.round(xpProgress * 100),
      totalWorkouts,
      totalReps,
      avgRepsPerWorkout,
      workoutsThisWeek: thisWeekWorkouts.length,
      workoutsLastWeek: lastWeekWorkouts.length,
      weekOverWeekChange: thisWeekWorkouts.length - lastWeekWorkouts.length,
      streak: userData.workoutStreak || 0
    };
  }

  analyzeTrends(workouts) {
    if (workouts.length < 3) {
      return {
        repsTrend: 'insufficient_data',
        frequencyTrend: 'insufficient_data',
        varietyTrend: 'insufficient_data',
        overallTrend: 'building'
      };
    }

    // Split workouts into halves for comparison
    const midpoint = Math.floor(workouts.length / 2);
    const firstHalf = workouts.slice(0, midpoint);
    const secondHalf = workouts.slice(midpoint);

    // Reps trend
    const avgRepsFirst = firstHalf.reduce((s, w) => s + (w.reps || 0), 0) / firstHalf.length;
    const avgRepsSecond = secondHalf.reduce((s, w) => s + (w.reps || 0), 0) / secondHalf.length;
    const repsChange = ((avgRepsSecond - avgRepsFirst) / avgRepsFirst) * 100;

    let repsTrend = 'stable';
    if (repsChange > 10) repsTrend = 'increasing';
    else if (repsChange < -10) repsTrend = 'decreasing';

    // Exercise variety trend
    const uniqueFirst = new Set(firstHalf.map(w => w.exercise)).size;
    const uniqueSecond = new Set(secondHalf.map(w => w.exercise)).size;
    
    let varietyTrend = 'stable';
    if (uniqueSecond > uniqueFirst) varietyTrend = 'improving';
    else if (uniqueSecond < uniqueFirst) varietyTrend = 'declining';

    // Overall trend calculation
    let overallScore = 0;
    if (repsTrend === 'increasing') overallScore += 2;
    else if (repsTrend === 'stable') overallScore += 1;
    if (varietyTrend === 'improving') overallScore += 2;
    else if (varietyTrend === 'stable') overallScore += 1;

    let overallTrend = 'stable';
    if (overallScore >= 3) overallTrend = 'improving';
    else if (overallScore <= 1) overallTrend = 'declining';

    return {
      repsTrend,
      repsChangePercent: Math.round(repsChange),
      frequencyTrend: secondHalf.length >= firstHalf.length ? 'stable_or_improving' : 'declining',
      varietyTrend,
      overallTrend
    };
  }

  calculateProjections(userData, trends) {
    const level = userData.avatar?.level || 1;
    const xp = userData.avatar?.xp || 0;
    const streak = userData.workoutStreak || 0;

    // XP projection based on average workout
    const avgXpPerWorkout = 30; // Average XP per workout session
    const xpNeeded = (level * 100) - xp;
    const daysToLevelUp = Math.ceil(xpNeeded / avgXpPerWorkout);

    // Streak projection
    const streakMultiplier = trends.overallTrend === 'improving' ? 1.2 : 
                            trends.overallTrend === 'declining' ? 0.8 : 1.0;
    const projectedStreak7Days = Math.round((streak + 7) * streakMultiplier);
    const projectedStreak30Days = Math.round((streak + 30) * streakMultiplier);

    // Stat projection
    const currentTotal = (userData.avatar?.strength || 10) + 
                        (userData.avatar?.endurance || 10) + 
                        (userData.avatar?.agility || 10);
    const projectedStats30Days = Math.round(currentTotal * (1 + (trends.overallTrend === 'improving' ? 0.15 : 0.08)));

    return {
      levelUpIn: {
        days: daysToLevelUp,
        confidence: streak > 7 ? 'high' : streak > 3 ? 'medium' : 'low'
      },
      projectedStreak: {
        in7Days: projectedStreak7Days,
        in30Days: projectedStreak30Days
      },
      projectedTotalStats: {
        current: currentTotal,
        in30Days: projectedStats30Days
      },
      projectedLevel: {
        in30Days: level + Math.floor(30 / daysToLevelUp)
      }
    };
  }

  identifyAchievements(userData, workouts) {
    const achievements = [];
    const streak = userData.workoutStreak || 0;
    const level = userData.avatar?.level || 1;
    const totalWorkouts = workouts.length;

    // Streak achievements
    if (streak >= 100) achievements.push({ type: 'streak', name: 'Century Streak', description: '100+ day streak' });
    else if (streak >= 30) achievements.push({ type: 'streak', name: 'Monthly Master', description: '30+ day streak' });
    else if (streak >= 14) achievements.push({ type: 'streak', name: 'Fortnight Fighter', description: '14+ day streak' });
    else if (streak >= 7) achievements.push({ type: 'streak', name: 'Week Warrior', description: '7+ day streak' });

    // Level achievements
    if (level >= 50) achievements.push({ type: 'level', name: 'Elite', description: 'Reached level 50' });
    else if (level >= 25) achievements.push({ type: 'level', name: 'Veteran', description: 'Reached level 25' });
    else if (level >= 10) achievements.push({ type: 'level', name: 'Rising Star', description: 'Reached level 10' });

    // Workout count achievements
    if (totalWorkouts >= 1000) achievements.push({ type: 'workouts', name: 'Millennium', description: '1000+ workouts' });
    else if (totalWorkouts >= 500) achievements.push({ type: 'workouts', name: 'Dedicated', description: '500+ workouts' });
    else if (totalWorkouts >= 100) achievements.push({ type: 'workouts', name: 'Centurion', description: '100+ workouts' });

    return achievements;
  }

  identifyAreasForImprovement(userData, trends) {
    const improvements = [];
    const stats = userData.avatar || {};
    const streak = userData.workoutStreak || 0;

    // Streak improvement
    if (streak < 7) {
      improvements.push({
        area: 'consistency',
        priority: 'high',
        suggestion: 'Focus on building a 7-day streak to establish the habit',
        actionable: 'Set a daily reminder and start with shorter workouts'
      });
    }

    // Stat balance
    const statValues = [stats.strength || 10, stats.endurance || 10, stats.agility || 10];
    const maxStat = Math.max(...statValues);
    const minStat = Math.min(...statValues);
    
    if (maxStat - minStat > 10) {
      const weakest = Object.entries({ 
        strength: stats.strength || 10, 
        endurance: stats.endurance || 10, 
        agility: stats.agility || 10 
      }).reduce((a, b) => a[1] < b[1] ? a : b)[0];
      
      improvements.push({
        area: 'balance',
        priority: 'medium',
        suggestion: `Your ${weakest} stat is lagging behind`,
        actionable: `Add more ${weakest}-focused exercises to your routine`
      });
    }

    // Trend-based improvements
    if (trends.repsTrend === 'decreasing') {
      improvements.push({
        area: 'intensity',
        priority: 'medium',
        suggestion: 'Your rep counts are declining',
        actionable: 'Focus on progressive overload - aim to add 1-2 reps each session'
      });
    }

    if (trends.varietyTrend === 'declining') {
      improvements.push({
        area: 'variety',
        priority: 'low',
        suggestion: 'You\'re doing fewer different exercises',
        actionable: 'Try adding a new exercise to your routine this week'
      });
    }

    return improvements;
  }

  calculateProgressScore(metrics, trends) {
    let score = 50; // Base score

    // Streak contribution (up to +20)
    score += Math.min(metrics.streak / 2, 20);

    // Workout frequency contribution (up to +15)
    score += Math.min(metrics.workoutsThisWeek * 3, 15);

    // Trend contribution (up to +15)
    if (trends.overallTrend === 'improving') score += 15;
    else if (trends.overallTrend === 'stable') score += 10;
    else if (trends.overallTrend === 'declining') score += 0;

    // Cap at 100
    return Math.min(Math.round(score), 100);
  }

  generateSummary(metrics, trends, projections) {
    const summaryParts = [];

    // Overall assessment
    if (metrics.streak >= 7 && trends.overallTrend === 'improving') {
      summaryParts.push("Excellent progress! You're consistently improving and building great habits.");
    } else if (metrics.streak >= 3) {
      summaryParts.push("Good progress! You're building momentum - keep it up!");
    } else {
      summaryParts.push("Getting started! Focus on consistency to see the best results.");
    }

    // Level projection
    summaryParts.push(`At your current pace, you'll reach Level ${metrics.currentLevel + 1} in about ${projections.levelUpIn.days} days.`);

    // Key stat
    if (metrics.weekOverWeekChange > 0) {
      summaryParts.push(`You did ${metrics.weekOverWeekChange} more workouts this week than last week!`);
    }

    return summaryParts.join(' ');
  }
}

// =============================================================================
// Goal Coordinator Agent (Orchestrator)
// =============================================================================

class GoalCoordinatorAgent extends Agent {
  constructor() {
    super('GoalCoordinator', 'Orchestrates agents and takes automated actions on behalf of users');
    this.trainingStrategist = new TrainingStrategistAgent();
    this.motivationCoach = new MotivationCoachAgent();
    this.progressAnalyst = new ProgressAnalystAgent();
  }

  async execute(context) {
    await super.execute(context);
    const { userData, recentWorkouts = [], takeActions = false } = context;
    
    this.log('Coordinating agents for comprehensive analysis', { 
      userId: userData.username,
      takeActions 
    });

    // Execute all agents in parallel
    const [strategyResult, motivationResult, progressResult] = await Promise.all([
      this.trainingStrategist.execute({ userData, recentWorkouts }),
      this.motivationCoach.execute({ userData, situationalContext: this.determineSituation(userData) }),
      this.progressAnalyst.execute({ userData, recentWorkouts })
    ]);

    // Synthesize results and determine recommended actions
    const synthesis = this.synthesizeResults(strategyResult, motivationResult, progressResult);
    
    // Generate automated actions if enabled
    const automatedActions = takeActions ? 
      this.generateAutomatedActions(userData, synthesis) : 
      { enabled: false, actions: [] };

    return {
      agent: this.name,
      orchestration: {
        agentsExecuted: ['TrainingStrategist', 'MotivationCoach', 'ProgressAnalyst'],
        executionTime: new Date().toISOString()
      },
      strategy: strategyResult,
      motivation: motivationResult,
      progress: progressResult,
      synthesis,
      automatedActions,
      generatedAt: new Date().toISOString()
    };
  }

  determineSituation(userData) {
    const streak = userData.workoutStreak || 0;
    const level = userData.avatar?.level || 1;
    const lastWorkout = userData.lastWorkout ? new Date(userData.lastWorkout) : null;
    const now = new Date();

    // Check if streak was broken
    if (lastWorkout) {
      const daysSinceLastWorkout = Math.floor((now - lastWorkout) / (24 * 60 * 60 * 1000));
      if (daysSinceLastWorkout >= 2) return 'streakRecovery';
    }

    // Check for level up (would need additional context)
    if (streak === 0) return 'streakRecovery';
    if (streak >= 7) return 'streakCelebration';
    
    return 'dailyStart';
  }

  synthesizeResults(strategy, motivation, progress) {
    // Calculate overall health score
    const healthScore = this.calculateHealthScore(strategy, progress);

    // Identify top priorities
    const priorities = [];
    
    if (progress.progressScore < 50) {
      priorities.push({
        type: 'consistency',
        urgency: 'high',
        description: 'Focus on building workout consistency'
      });
    }

    if (strategy.analysis.weakestStat && 
        strategy.analysis.avgStat - strategy.analysis[strategy.analysis.weakestStat] > 5) {
      priorities.push({
        type: 'balance',
        urgency: 'medium',
        description: `Work on improving ${strategy.analysis.weakestStat}`
      });
    }

    // Generate unified recommendations
    const unifiedRecommendations = this.unifyRecommendations(strategy, progress);

    return {
      healthScore,
      priorities,
      unifiedRecommendations,
      keyInsight: this.generateKeyInsight(strategy, motivation, progress)
    };
  }

  calculateHealthScore(strategy, progress) {
    const consistencyScore = Math.min(progress.progressMetrics.streak * 3, 30);
    const balanceScore = 100 - Math.abs(
      (strategy.analysis.strongestStat || 10) - (strategy.analysis.weakestStat || 10)
    ) * 2;
    const progressScore = progress.progressScore;

    const overall = Math.round((consistencyScore + balanceScore + progressScore) / 3);
    
    return {
      overall: Math.min(overall, 100),
      consistency: Math.min(consistencyScore * 3.33, 100),
      balance: Math.min(balanceScore, 100),
      progress: progressScore,
      grade: overall >= 80 ? 'A' : overall >= 60 ? 'B' : overall >= 40 ? 'C' : 'D'
    };
  }

  unifyRecommendations(strategy, progress) {
    const unified = [];

    // Combine strategy recommendations
    strategy.strategyRecommendations.forEach(rec => {
      unified.push({
        source: 'strategy',
        type: rec.type,
        priority: rec.priority,
        message: rec.message,
        action: rec.action
      });
    });

    // Combine progress improvements
    progress.areasForImprovement.forEach(imp => {
      unified.push({
        source: 'progress',
        type: imp.area,
        priority: imp.priority,
        message: imp.suggestion,
        action: imp.actionable
      });
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    unified.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    return unified.slice(0, 5); // Return top 5 recommendations
  }

  generateKeyInsight(strategy, motivation, progress) {
    const streak = progress.progressMetrics.streak;
    const trend = progress.trends.overallTrend;
    const score = progress.progressScore;

    if (score >= 80 && trend === 'improving') {
      return "You're crushing it! Your consistency and improvement are exceptional. Keep this momentum!";
    } else if (score >= 60 && streak >= 7) {
      return "Great work maintaining your streak! Focus on progressive overload to accelerate your gains.";
    } else if (streak >= 3) {
      return "You're building a foundation! The next 4 days are crucial - push through to a 7-day streak.";
    } else if (trend === 'declining') {
      return "Let's get back on track! Start with one workout today and rebuild from there.";
    } else {
      return "Every journey starts with a single step. Your potential is unlimited - let's unlock it together!";
    }
  }

  generateAutomatedActions(userData, synthesis) {
    const actions = [];
    const userId = userData.uid || userData.id;

    // Action 1: Set daily goal based on strategy
    if (synthesis.healthScore.overall < 70) {
      actions.push({
        type: 'SET_DAILY_GOAL',
        target: 'user.dailyGoal',
        value: {
          exercise: 'squat',
          targetReps: 15,
          reason: 'Starting with an achievable goal to build consistency'
        },
        automated: true,
        userId
      });
    }

    // Action 2: Adjust difficulty based on progress
    if (synthesis.healthScore.progress >= 80) {
      actions.push({
        type: 'ADJUST_DIFFICULTY',
        target: 'user.difficulty',
        value: {
          level: 'challenging',
          multiplier: 1.2,
          reason: 'Your progress indicates you\'re ready for more challenge'
        },
        automated: true,
        userId
      });
    }

    // Action 3: Generate personalized quest if needed
    if (synthesis.priorities.some(p => p.type === 'consistency')) {
      actions.push({
        type: 'CREATE_QUEST',
        target: 'quests',
        value: {
          title: 'Consistency Challenge',
          description: 'Complete 3 workouts in the next 3 days',
          target: 3,
          reward: 50,
          type: 'ai_generated',
          expiresIn: 3 * 24 * 60 * 60 * 1000 // 3 days
        },
        automated: true,
        userId
      });
    }

    // Action 4: Set motivational reminder
    actions.push({
      type: 'SET_REMINDER',
      target: 'user.reminder',
      value: {
        message: synthesis.keyInsight,
        type: 'motivational',
        scheduledFor: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
      },
      automated: true,
      userId
    });

    return {
      enabled: true,
      count: actions.length,
      actions,
      executedAt: new Date().toISOString()
    };
  }

  // Get all agent stats
  getAllAgentStats() {
    return {
      coordinator: this.getStats(),
      trainingStrategist: this.trainingStrategist.getStats(),
      motivationCoach: this.motivationCoach.getStats(),
      progressAnalyst: this.progressAnalyst.getStats()
    };
  }
}

// =============================================================================
// Agent Manager
// =============================================================================

class AgentManager {
  constructor() {
    this.coordinator = new GoalCoordinatorAgent();
    this.initialized = new Date();
  }

  async runFullAnalysis(userData, recentWorkouts = [], takeActions = false) {
    logger.info('AgentManager: Running full analysis', { 
      userId: userData.username,
      workoutCount: recentWorkouts.length,
      takeActions
    });

    return await this.coordinator.execute({
      userData,
      recentWorkouts,
      takeActions
    });
  }

  async runStrategyOnly(userData, recentWorkouts = []) {
    const agent = new TrainingStrategistAgent();
    return await agent.execute({ userData, recentWorkouts });
  }

  async runMotivationOnly(userData, context = 'dailyStart') {
    const agent = new MotivationCoachAgent();
    return await agent.execute({ userData, situationalContext: context });
  }

  async runProgressOnly(userData, recentWorkouts = []) {
    const agent = new ProgressAnalystAgent();
    return await agent.execute({ userData, recentWorkouts });
  }

  getStatus() {
    return {
      initialized: this.initialized,
      agents: this.coordinator.getAllAgentStats(),
      status: 'operational',
      gemini: geminiService.getStatus()
    };
  }
}

// Export singleton instance
const agentManager = new AgentManager();

module.exports = {
  agentManager,
  AgentManager,
  TrainingStrategistAgent,
  MotivationCoachAgent,
  ProgressAnalystAgent,
  GoalCoordinatorAgent
};

