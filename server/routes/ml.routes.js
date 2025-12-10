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
 * ENHANCED with Multi-Agent AI System:
 * - Training Strategist Agent: Creates personalized workout plans
 * - Motivation Coach Agent: Generates contextual motivational content
 * - Progress Analyst Agent: Evaluates user progress and trends
 * - Goal Coordinator Agent: Orchestrates agents and automates actions
 * 
 * All features work 100% FREE without any API keys!
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/auth.middleware');
const questService = require('../services/gameplay/quest.service');
const mlService = require('../services/shared/ml.service');

// Import enhanced ML services
const { agentManager } = require('../services/shared/agents.service');
const { actionExecutor } = require('../services/shared/action-executor.service');
const { mlAssessmentService } = require('../services/shared/ml-assessment.service');
const { mlDataCollector } = require('../services/shared/ml-data-collector.service');

// Import user service for production data access
const userService = require('../services/user/user.service');

/**
 * Helper to get user data from request
 * Returns default values for unauthenticated users
 */
function getUserData(req) {
  if (req.user) {
    return {
      username: req.user.username,
      uid: req.user.uid,
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
  
  // Default for unauthenticated requests
  return {
    username: 'Guest',
    uid: null,
    avatar: {
      level: 1,
      xp: 0,
      strength: 10,
      endurance: 10,
      agility: 10,
      equipment: {}
    },
    workoutStreak: 0,
    lastWorkout: null,
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
    
    // Get user's actual quests if authenticated
    let quests = [];
    if (userData.uid) {
      try {
        quests = await questService.getUserQuests(userData.uid);
      } catch (e) {
        // Fall back to quest templates if user quests not available
        quests = Object.values(questService.QUEST_TEMPLATES.daily || []);
      }
    } else {
      // Use quest templates for unauthenticated users
      quests = Object.values(questService.QUEST_TEMPLATES.daily || []);
    }
    
    const suggestions = await mlService.getQuestSuggestions(userData, quests);
    
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
    
    // Get user's actual quests if authenticated
    let quests = [];
    if (userData.uid) {
      try {
        quests = await questService.getUserQuests(userData.uid);
      } catch (e) {
        quests = Object.values(questService.QUEST_TEMPLATES.daily || []);
      }
    } else {
      quests = Object.values(questService.QUEST_TEMPLATES.daily || []);
    }
    
    const session = await mlService.getCoachingSession(userData, quests);
    
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
      feedback.push(`Incredible ${exerciseNames[exercise] || exercise} session! ${reps} reps is impressive!`);
    } else if (reps >= 10) {
      feedback.push(`Solid ${exerciseNames[exercise] || exercise} workout! Keep pushing!`);
    } else {
      feedback.push(`Good start with ${exerciseNames[exercise] || exercise}! Every rep counts!`);
    }
    
    // Stat impact analysis
    const statImpact = {
      squat: { primary: 'agility', secondary: 'endurance' },
      pushup: { primary: 'strength', secondary: 'endurance' },
      pullup: { primary: 'strength', secondary: 'agility' },
      run: { primary: 'endurance', secondary: 'agility' }
    };
    
    const impact = statImpact[exercise] || { primary: 'strength', secondary: 'endurance' };
    feedback.push(`This workout primarily boosts your ${impact.primary}!`);
    
    // Streak reminder
    if (userData.workoutStreak > 0) {
      feedback.push(`${userData.workoutStreak + 1}-day streak incoming!`);
    } else {
      feedback.push(`First workout of a new streak!`);
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
  
  const agentStatus = agentManager.getStatus();
  
  res.json({
    success: true,
    service: 'ForgeMaster AI',
    version: '2.1.0',
    status: 'operational',
    capabilities: {
      workoutRecommendations: true,
      performancePredictions: true,
      motivationalCoaching: true,
      questSuggestions: true,
      patternAnalysis: true,
      coachingSessions: true,
      // Enhanced capabilities (v2.0)
      multiAgentSystem: true,
      automatedActions: true,
      mlAssessment: true,
      dataCollection: true,
      // Gemini Integration (v2.1)
      geminiAI: hasGeminiKey
    },
    engine: hasGeminiKey ? 'gemini_enhanced' : 'multi_agent_ai',
    description: hasGeminiKey 
      ? 'Multi-Agent AI with Google Gemini (FREE: 15 req/min, 1,500/day)'
      : 'Multi-Agent AI system (100% free, rule-based)',
    freeToUse: true,
    apiInfo: {
      provider: hasGeminiKey ? 'Google Gemini + Local Agents' : 'Local Multi-Agent System',
      freeTier: hasGeminiKey ? '15 requests/min, 1,500 requests/day' : 'Unlimited',
      cost: '$0 (completely free)'
    },
    agents: agentStatus,
    gemini: agentStatus.gemini
  });
});

// =============================================================================
// ENHANCED ML ENDPOINTS - Multi-Agent System
// =============================================================================

/**
 * GET /api/ml/agents/analyze
 * Get comprehensive AI agent analysis
 * All agents work together to analyze user data and provide insights
 */
router.get('/agents/analyze', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    const takeActions = req.query.takeActions === 'true';
    
    logger.info('Agent analysis requested', {
      userId: userData.username,
      takeActions,
      action: 'ML_AGENT_ANALYSIS'
    });

    // Collect ML interaction
    mlDataCollector.collectMLInteraction(userData.uid, 'agent_analysis', {
      endpoint: '/agents/analyze',
      data: { takeActions }
    });

    const startTime = Date.now();
    const analysis = await agentManager.runFullAnalysis(
      userData,
      userData.recentWorkouts || [],
      takeActions
    );
    const duration = Date.now() - startTime;

    // Collect agent execution data
    mlDataCollector.collectAgentExecution('GoalCoordinator', {
      userId: userData.uid,
      executionTime: duration,
      success: true,
      actionsGenerated: analysis.automatedActions?.count || 0
    });

    // Execute automated actions if enabled and user is authenticated
    if (takeActions && userData.uid && analysis.automatedActions?.actions?.length > 0) {
      const actionResults = await actionExecutor.executeActions(analysis.automatedActions.actions);
      analysis.actionResults = actionResults;
      
      logger.info('Automated actions executed', {
        userId: userData.uid,
        actionsExecuted: actionResults.successful,
        actionsFailed: actionResults.failed
      });
    }

    res.json({
      success: true,
      source: 'multi_agent_system',
      generatedAt: new Date().toISOString(),
      executionTime: duration,
      ...analysis
    });
  } catch (error) {
    logger.error('Failed to run agent analysis', {
      error: error.message,
      action: 'ML_AGENT_ANALYSIS'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to run agent analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/ml/agents/strategy
 * Get training strategy from the Training Strategist Agent
 */
router.get('/agents/strategy', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('Strategy agent requested', {
      userId: userData.username,
      action: 'ML_AGENT_STRATEGY'
    });

    mlDataCollector.collectMLInteraction(userData.uid, 'strategy_agent', {
      endpoint: '/agents/strategy'
    });

    const strategy = await agentManager.runStrategyOnly(
      userData,
      userData.recentWorkouts || []
    );

    res.json({
      success: true,
      source: 'training_strategist_agent',
      generatedAt: new Date().toISOString(),
      ...strategy
    });
  } catch (error) {
    logger.error('Failed to get strategy', {
      error: error.message,
      action: 'ML_AGENT_STRATEGY'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get training strategy',
      message: error.message
    });
  }
});

/**
 * GET /api/ml/agents/motivation
 * Get personalized motivation from the Motivation Coach Agent
 */
router.get('/agents/motivation', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    const context = req.query.context || 'dailyStart';
    
    logger.info('Motivation agent requested', {
      userId: userData.username,
      context,
      action: 'ML_AGENT_MOTIVATION'
    });

    mlDataCollector.collectMLInteraction(userData.uid, 'motivation_agent', {
      endpoint: '/agents/motivation',
      data: { context }
    });

    const motivation = await agentManager.runMotivationOnly(userData, context);

    res.json({
      success: true,
      source: 'motivation_coach_agent',
      generatedAt: new Date().toISOString(),
      ...motivation
    });
  } catch (error) {
    logger.error('Failed to get motivation', {
      error: error.message,
      action: 'ML_AGENT_MOTIVATION'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get motivation',
      message: error.message
    });
  }
});

/**
 * GET /api/ml/agents/progress
 * Get progress analysis from the Progress Analyst Agent
 */
router.get('/agents/progress', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const userData = getUserData(req);
    
    logger.info('Progress agent requested', {
      userId: userData.username,
      action: 'ML_AGENT_PROGRESS'
    });

    mlDataCollector.collectMLInteraction(userData.uid, 'progress_agent', {
      endpoint: '/agents/progress'
    });

    const progress = await agentManager.runProgressOnly(
      userData,
      userData.recentWorkouts || []
    );

    res.json({
      success: true,
      source: 'progress_analyst_agent',
      generatedAt: new Date().toISOString(),
      ...progress
    });
  } catch (error) {
    logger.error('Failed to get progress analysis', {
      error: error.message,
      action: 'ML_AGENT_PROGRESS'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get progress analysis',
      message: error.message
    });
  }
});

/**
 * POST /api/ml/agents/execute-actions
 * Execute automated actions on behalf of the user
 * This endpoint takes action by modifying user data in the database
 */
router.post('/agents/execute-actions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userData = getUserData(req);
    const { actions } = req.body;
    
    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'Actions array is required'
      });
    }
    
    logger.info('Executing automated actions', {
      userId: userData.uid,
      actionCount: actions.length,
      action: 'ML_EXECUTE_ACTIONS'
    });

    // Add userId to all actions
    const actionsWithUser = actions.map(action => ({
      ...action,
      userId: userData.uid
    }));

    const results = await actionExecutor.executeActions(actionsWithUser);

    // Collect data for ML improvement
    actionsWithUser.forEach(action => {
      mlDataCollector.collectEngagementSignal(userData.uid, 'action_execution', {
        actionType: action.type,
        automated: action.automated
      });
    });

    res.json({
      success: true,
      source: 'action_executor',
      executedAt: new Date().toISOString(),
      results
    });
  } catch (error) {
    logger.error('Failed to execute actions', {
      error: error.message,
      action: 'ML_EXECUTE_ACTIONS'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to execute actions',
      message: error.message
    });
  }
});

/**
 * GET /api/ml/agents/status
 * Get status of all AI agents
 */
router.get('/agents/status', (req, res) => {
  const status = agentManager.getStatus();
  const executorStats = actionExecutor.getExecutionStats();

  res.json({
    success: true,
    agentSystem: status,
    actionExecutor: executorStats,
    dataCollector: mlDataCollector.getStatus()
  });
});

// =============================================================================
// ML ASSESSMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/ml/assessment/run
 * Run automated ML assessment against REAL production data from Firebase
 * This assessment is completely automated and uses live data
 */
router.get('/assessment/run', authMiddleware.optionalAuth, async (req, res) => {
  try {
    logger.info('ML assessment requested - fetching production data', {
      action: 'ML_ASSESSMENT_RUN'
    });

    // =====================================================================
    // STEP 1: Fetch REAL production data from Firebase
    // =====================================================================
    
    // Get all users from production Firebase database
    let productionUsers = [];
    try {
      productionUsers = await userService.getAllUsers(100); // Get up to 100 users
      logger.info('Fetched production users from Firebase', { count: productionUsers.length });
    } catch (dbError) {
      logger.warn('Could not fetch users from Firebase, using collected data', { error: dbError.message });
    }

    // Get active users (users who worked out in last 7 days)
    let activeUsers = [];
    try {
      activeUsers = await userService.getActiveUsers(7);
      logger.info('Fetched active users from Firebase', { count: activeUsers.length });
    } catch (dbError) {
      logger.warn('Could not fetch active users', { error: dbError.message });
    }

    // =====================================================================
    // STEP 2: Combine with collected runtime data
    // =====================================================================
    
    // Get collected workout and ML interaction data
    const collectedData = mlDataCollector.getProductionData();
    
    // Merge production data
    const productionData = {
      // Real users from Firebase (production database)
      users: productionUsers.length > 0 ? productionUsers : collectedData.users || [],
      activeUsers: activeUsers,
      
      // Collected runtime data
      workouts: collectedData.workouts || [],
      mlInteractions: collectedData.mlInteractions || [],
      predictions: collectedData.predictions || [],
      automatedActions: collectedData.agentExecutions || [],
      engagementSignals: collectedData.engagementSignals || [],
      
      // Agent execution stats
      agentStats: agentManager.getStatus().agents,
      
      // Metadata
      dataSource: {
        usersFrom: productionUsers.length > 0 ? 'firebase_production' : 'runtime_collection',
        workoutsFrom: 'runtime_collection',
        collectedAt: new Date().toISOString()
      }
    };

    logger.info('Production data assembled for assessment', {
      userCount: productionData.users.length,
      activeUserCount: productionData.activeUsers.length,
      workoutCount: productionData.workouts.length,
      interactionCount: productionData.mlInteractions.length,
      dataSource: productionData.dataSource.usersFrom
    });

    // =====================================================================
    // STEP 3: Run automated ML assessment
    // =====================================================================
    
    const assessment = await mlAssessmentService.runFullAssessment(productionData);

    // =====================================================================
    // STEP 4: Return comprehensive assessment results
    // =====================================================================
    
    res.json({
      success: true,
      assessment,
      productionDataSummary: {
        totalUsers: productionData.users.length,
        activeUsers: productionData.activeUsers.length,
        workoutsCollected: productionData.workouts.length,
        mlInteractions: productionData.mlInteractions.length,
        dataSource: productionData.dataSource
      },
      dataQuality: assessment.dataQuality,
      note: 'Assessment uses REAL production data from Firebase database'
    });
  } catch (error) {
    logger.error('Failed to run ML assessment', {
      error: error.message,
      stack: error.stack,
      action: 'ML_ASSESSMENT_RUN'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to run assessment',
      message: error.message
    });
  }
});

/**
 * GET /api/ml/assessment/history
 * Get history of ML assessments
 */
router.get('/assessment/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const history = mlAssessmentService.getAssessmentHistory(limit);
  const trends = mlAssessmentService.getAssessmentTrends();

  res.json({
    success: true,
    history,
    trends,
    count: history.length
  });
});

/**
 * GET /api/ml/assessment/benchmarks
 * Get current ML performance benchmarks
 */
router.get('/assessment/benchmarks', (req, res) => {
  res.json({
    success: true,
    benchmarks: mlAssessmentService.benchmarks,
    description: {
      recommendationRelevance: 'Target relevance of workout recommendations to user needs',
      predictionAccuracy: 'Target accuracy of level-up and progress predictions',
      userEngagement: 'Target user engagement rate with ML features',
      actionEffectiveness: 'Target effectiveness of automated actions',
      agentCoordination: 'Target quality of inter-agent coordination'
    }
  });
});

// =============================================================================
// DATA COLLECTION ENDPOINTS
// =============================================================================

/**
 * GET /api/ml/data/status
 * Get data collection status and statistics
 */
router.get('/data/status', (req, res) => {
  const status = mlDataCollector.getStatus();
  
  res.json({
    success: true,
    ...status
  });
});

/**
 * GET /api/ml/data/analytics
 * Get analytics from collected production data
 */
router.get('/data/analytics', (req, res) => {
  const workoutAnalytics = mlDataCollector.getWorkoutAnalytics();
  const interactionAnalytics = mlDataCollector.getMLInteractionAnalytics();
  const predictionAnalytics = mlDataCollector.getPredictionAnalytics();

  res.json({
    success: true,
    workoutAnalytics,
    interactionAnalytics,
    predictionAnalytics,
    collectionStats: mlDataCollector.getCollectionStats()
  });
});

/**
 * POST /api/ml/data/collect-workout
 * Collect workout data for ML improvement
 * Called automatically when users complete workouts
 */
router.post('/data/collect-workout', authMiddleware.optionalAuth, (req, res) => {
  try {
    const userData = getUserData(req);
    const { exercise, reps, xpGained } = req.body;
    
    if (!exercise || !reps) {
      return res.status(400).json({
        success: false,
        error: 'Exercise and reps are required'
      });
    }

    const record = mlDataCollector.collectWorkoutData(userData.uid || 'anonymous', {
      exercise,
      reps,
      xpGained
    });

    res.json({
      success: true,
      message: 'Workout data collected for ML improvement',
      record
    });
  } catch (error) {
    logger.error('Failed to collect workout data', {
      error: error.message,
      action: 'ML_DATA_COLLECT_WORKOUT'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to collect workout data',
      message: error.message
    });
  }
});

/**
 * POST /api/ml/data/collect-prediction-outcome
 * Record the actual outcome of a prediction for accuracy tracking
 */
router.post('/data/collect-prediction-outcome', authMiddleware.optionalAuth, (req, res) => {
  try {
    const userData = getUserData(req);
    const { prediction, actualOutcome } = req.body;
    
    if (!prediction || !actualOutcome) {
      return res.status(400).json({
        success: false,
        error: 'Prediction and actual outcome are required'
      });
    }

    const record = mlDataCollector.collectPredictionOutcome(
      userData.uid || 'anonymous',
      prediction,
      actualOutcome
    );

    res.json({
      success: true,
      message: 'Prediction outcome collected',
      record
    });
  } catch (error) {
    logger.error('Failed to collect prediction outcome', {
      error: error.message,
      action: 'ML_DATA_COLLECT_PREDICTION'
    });
    res.status(500).json({
      success: false,
      error: 'Failed to collect prediction outcome',
      message: error.message
    });
  }
});

module.exports = router;

