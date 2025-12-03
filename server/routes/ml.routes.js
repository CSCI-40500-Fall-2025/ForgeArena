/**
 * Machine Learning API Routes for ForgeArena
 * 
 * These endpoints provide AI-powered fitness coaching features:
 * - Personalized workout recommendations
 * - Performance predictions
 * - Motivational coaching
 * - Quest suggestions
 * - Workout pattern analysis
 * 
 * All features work 100% FREE without any API keys!
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const mlService = require('../services/ml.service');
const authMiddleware = require('../middleware/auth.middleware');

// Import mock data for fallback
const { mockUser, mockQuests } = require('../../shared/mockData');

/**
 * Helper to get user data from request or fallback to mock
 */
function getUserData(req) {
  if (req.user) {
    return {
      username: req.user.username,
      avatar: {
        level: req.user.level || 1,
        xp: req.user.xp || 0,
        strength: req.user.strength || 10,
        endurance: req.user.endurance || 10,
        agility: req.user.agility || 10,
        equipment: req.user.equipment || {}
      },
      workoutStreak: req.user.workoutStreak || 0,
      lastWorkout: req.user.lastWorkout || null,
      recentWorkouts: req.user.recentWorkouts || []
    };
  }
  
  // Fallback to mock user
  return {
    username: mockUser.username,
    avatar: mockUser.avatar,
    workoutStreak: mockUser.workoutStreak,
    lastWorkout: mockUser.lastWorkout,
    recentWorkouts: []
  };
}

/**
 * GET /api/ml/recommendations
 * Get personalized workout recommendations
 */
router.get('/recommendations', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('ML recommendations requested', { 
      userId: userData.username,
      action: 'ML_RECOMMENDATIONS'
    });
    
    const recommendations = await mlService.getWorkoutRecommendations(userData);
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Failed to generate ML recommendations', { 
      error: error.message,
      action: 'ML_RECOMMENDATIONS'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate recommendations',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/predictions
 * Get performance predictions and insights
 */
router.get('/predictions', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('ML predictions requested', { 
      userId: userData.username,
      action: 'ML_PREDICTIONS'
    });
    
    const predictions = await mlService.getPerformancePrediction(userData);
    
    res.json(predictions);
  } catch (error) {
    logger.error('Failed to generate ML predictions', { 
      error: error.message,
      action: 'ML_PREDICTIONS'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate predictions',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/motivation
 * Get motivational coaching message
 * Query params: context (daily, streak_broken, level_up, quest_complete, new_user, comeback)
 */
router.get('/motivation', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    const context = req.query.context || 'daily';
    
    logger.info('ML motivation requested', { 
      userId: userData.username,
      context,
      action: 'ML_MOTIVATION'
    });
    
    const motivation = await mlService.getMotivationalCoaching(userData, context);
    
    res.json(motivation);
  } catch (error) {
    logger.error('Failed to generate ML motivation', { 
      error: error.message,
      action: 'ML_MOTIVATION'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate motivation',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/quest-suggestions
 * Get AI-powered quest suggestions
 */
router.get('/quest-suggestions', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('ML quest suggestions requested', { 
      userId: userData.username,
      action: 'ML_QUEST_SUGGESTIONS'
    });
    
    const suggestions = await mlService.getQuestSuggestions(userData, mockQuests);
    
    res.json(suggestions);
  } catch (error) {
    logger.error('Failed to generate ML quest suggestions', { 
      error: error.message,
      action: 'ML_QUEST_SUGGESTIONS'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate quest suggestions',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/patterns
 * Analyze workout patterns
 */
router.get('/patterns', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('ML pattern analysis requested', { 
      userId: userData.username,
      action: 'ML_PATTERNS'
    });
    
    const patterns = mlService.analyzeWorkoutPatterns(userData.recentWorkouts || []);
    
    res.json(patterns);
  } catch (error) {
    logger.error('Failed to analyze workout patterns', { 
      error: error.message,
      action: 'ML_PATTERNS'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze patterns',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/coaching-session
 * Get a complete AI coaching session with all features
 */
router.get('/coaching-session', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('ML coaching session requested', { 
      userId: userData.username,
      action: 'ML_COACHING_SESSION'
    });
    
    const session = await mlService.getCoachingSession(userData, mockQuests);
    
    res.json(session);
  } catch (error) {
    logger.error('Failed to generate coaching session', { 
      error: error.message,
      action: 'ML_COACHING_SESSION'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate coaching session',
      message: error.message 
    });
  }
});

/**
 * POST /api/ml/analyze-workout
 * Analyze a specific workout and get feedback
 */
router.post('/analyze-workout', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const { exercise, reps, duration } = req.body;
    const userData = getUserData(req);
    
    if (!exercise || !reps) {
      return res.status(400).json({
        success: false,
        error: 'Exercise and reps are required'
      });
    }
    
    logger.info('ML workout analysis requested', { 
      userId: userData.username,
      exercise,
      reps,
      action: 'ML_ANALYZE_WORKOUT'
    });
    
    // Calculate XP and provide feedback
    const xpEarned = reps * 2;
    const isHighPerformance = reps > 20;
    const exerciseNames = {
      squat: 'Squats',
      pushup: 'Push-ups',
      pullup: 'Pull-ups',
      run: 'Running'
    };
    
    // Generate personalized feedback
    const feedback = [];
    
    if (isHighPerformance) {
      feedback.push(`🔥 Incredible ${exerciseNames[exercise] || exercise} session! ${reps} reps is impressive!`);
    } else if (reps >= 10) {
      feedback.push(`💪 Solid ${exerciseNames[exercise] || exercise} workout! Keep pushing!`);
    } else {
      feedback.push(`👍 Good start with ${exerciseNames[exercise] || exercise}! Every rep counts!`);
    }
    
    // Stat impact analysis
    const statImpact = {
      squat: { primary: 'agility', secondary: 'endurance' },
      pushup: { primary: 'strength', secondary: 'endurance' },
      pullup: { primary: 'strength', secondary: 'agility' },
      run: { primary: 'endurance', secondary: 'agility' }
    };
    
    const impact = statImpact[exercise] || { primary: 'strength', secondary: 'endurance' };
    feedback.push(`📊 This workout primarily boosts your ${impact.primary}!`);
    
    // Streak reminder
    if (userData.workoutStreak > 0) {
      feedback.push(`🔥 ${userData.workoutStreak + 1}-day streak incoming!`);
    } else {
      feedback.push(`🎯 First workout of a new streak!`);
    }
    
    res.json({
      success: true,
      source: 'forgemaster_ai',
      generatedAt: new Date().toISOString(),
      workout: {
        exercise: exerciseNames[exercise] || exercise,
        reps,
        duration: duration || null
      },
      xpEarned,
      statImpact: impact,
      isHighPerformance,
      feedback,
      nextRecommendation: await mlService.getWorkoutRecommendations({
        ...userData,
        recentWorkouts: [...(userData.recentWorkouts || []), { exercise, reps }]
      })
    });
  } catch (error) {
    logger.error('Failed to analyze workout', { 
      error: error.message,
      action: 'ML_ANALYZE_WORKOUT'
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze workout',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml/status
 * Check ML service status and capabilities
 */
router.get('/status', (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  
  res.json({
    success: true,
    service: 'ForgeMaster AI',
    version: '1.0.0',
    status: 'operational',
    capabilities: {
      workoutRecommendations: true,
      performancePredictions: true,
      motivationalCoaching: true,
      questSuggestions: true,
      patternAnalysis: true,
      coachingSessions: true
    },
    engine: hasGeminiKey ? 'gemini_enhanced' : 'rule_based_ai',
    description: hasGeminiKey 
      ? 'Enhanced AI with Google Gemini integration (FREE tier: 15 req/min, 1M tokens/month)'
      : 'Intelligent rule-based AI system (100% free, no API key needed)',
    freeToUse: true,
    apiInfo: {
      provider: hasGeminiKey ? 'Google Gemini' : 'Local Processing',
      freeTier: hasGeminiKey ? '15 requests/minute, 1,500 requests/day, 1M tokens/month' : 'Unlimited',
      cost: '$0 (completely free)'
    }
  });
});

module.exports = router;

