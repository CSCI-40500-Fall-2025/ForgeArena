/**
 * Gemini AI Service for ForgeArena
 * 
 * Integrates Google Gemini for enhanced AI capabilities.
 * Uses the FREE tier: 15 requests/min, 1,500 requests/day, 1M tokens/month
 * 
 * Falls back to rule-based responses if:
 * - GEMINI_API_KEY is not set
 * - API rate limit exceeded
 * - API errors occur
 */

const logger = require('../../utils/logger');

let GoogleGenerativeAI;
let genAI = null;
let model = null;

// Try to load the Gemini SDK
try {
  const geminiModule = require('@google/generative-ai');
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (error) {
  logger.warn('Gemini SDK not installed. Run: npm install @google/generative-ai');
}

/**
 * Initialize Gemini client
 */
function initGemini() {
  if (model) return model;
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    logger.info('GEMINI_API_KEY not set - using rule-based AI only');
    return null;
  }
  
  if (!GoogleGenerativeAI) {
    logger.warn('Gemini SDK not available');
    return null;
  }
  
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',  // Fast and free
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      }
    });
    
    logger.info('Gemini AI initialized successfully', {
      model: 'gemini-1.5-flash',
      freeTier: '15 req/min, 1,500 req/day'
    });
    
    return model;
  } catch (error) {
    logger.error('Failed to initialize Gemini', { error: error.message });
    return null;
  }
}

/**
 * Check if Gemini is available
 */
function isGeminiAvailable() {
  return !!process.env.GEMINI_API_KEY && !!GoogleGenerativeAI;
}

/**
 * Generate content using Gemini
 * @param {string} prompt - The prompt to send
 * @param {object} options - Additional options
 * @returns {Promise<string|null>} Generated text or null if failed
 */
async function generateContent(prompt, options = {}) {
  const geminiModel = initGemini();
  
  if (!geminiModel) {
    return null;
  }
  
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    logger.debug('Gemini generated content', {
      promptLength: prompt.length,
      responseLength: text.length
    });
    
    return text;
  } catch (error) {
    logger.error('Gemini generation failed', { 
      error: error.message,
      code: error.code 
    });
    return null;
  }
}

/**
 * Generate personalized workout recommendation using Gemini
 */
async function generateWorkoutRecommendation(userData) {
  const prompt = `You are a fitness coach AI for a gamified fitness app called ForgeArena.

User Profile:
- Level: ${userData.avatar?.level || 1}
- Strength: ${userData.avatar?.strength || 10}
- Endurance: ${userData.avatar?.endurance || 10}
- Agility: ${userData.avatar?.agility || 10}
- Workout Streak: ${userData.workoutStreak || 0} days
- Username: ${userData.username || 'Warrior'}

Generate a brief, encouraging workout recommendation (2-3 sentences max). Focus on their weakest stat. Be motivational but concise. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Generate personalized motivation using Gemini
 */
async function generateMotivation(userData, context = 'daily') {
  const contextDescriptions = {
    daily: 'starting their day',
    streakCelebration: `celebrating a ${userData.workoutStreak || 7}-day streak`,
    streakRecovery: 'recovering from a broken streak',
    levelUp: `just reached level ${userData.avatar?.level || 1}`,
    pushHarder: 'needing extra motivation to push harder',
    recovery: 'on a rest day'
  };

  const prompt = `You are a motivational fitness coach AI for ForgeArena.

User: ${userData.username || 'Warrior'} (Level ${userData.avatar?.level || 1})
Situation: ${contextDescriptions[context] || contextDescriptions.daily}
Streak: ${userData.workoutStreak || 0} days

Generate ONE short, powerful motivational message (1-2 sentences max). Be specific to their situation. Be encouraging but not cheesy. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Generate training strategy insights using Gemini
 */
async function generateStrategyInsight(userData, weeklyPlan) {
  const stats = userData.avatar || {};
  const weakest = Object.entries({
    strength: stats.strength || 10,
    endurance: stats.endurance || 10,
    agility: stats.agility || 10
  }).reduce((a, b) => a[1] < b[1] ? a : b)[0];

  const prompt = `You are a fitness strategist AI for ForgeArena.

User Stats:
- Strength: ${stats.strength || 10}
- Endurance: ${stats.endurance || 10}
- Agility: ${stats.agility || 10}
- Weakest area: ${weakest}
- Level: ${stats.level || 1}
- Streak: ${userData.workoutStreak || 0} days

Provide ONE brief strategic insight (2 sentences max) about how they should approach their training this week. Focus on balancing their stats. Be specific and actionable. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Generate progress analysis using Gemini
 */
async function generateProgressAnalysis(userData, progressMetrics) {
  const prompt = `You are a progress analyst AI for ForgeArena.

User Progress:
- Current Level: ${progressMetrics.currentLevel || 1}
- Workouts This Week: ${progressMetrics.workoutsThisWeek || 0}
- Streak: ${progressMetrics.streak || 0} days
- Progress Score: ${progressMetrics.levelProgress || 0}%
- Trend: ${progressMetrics.trend || 'stable'}

Provide ONE brief analysis (2 sentences max) of their progress. Highlight what they're doing well and one area to improve. Be encouraging and specific. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Generate quest suggestion using Gemini
 */
async function generateQuestSuggestion(userData, availableQuests) {
  const prompt = `You are a quest advisor AI for ForgeArena.

User:
- Level: ${userData.avatar?.level || 1}
- Streak: ${userData.workoutStreak || 0} days
- Available quests: ${availableQuests.length || 0}

Suggest what type of quest the user should focus on next (e.g., consistency challenge, strength building, endurance test). Keep response to ONE sentence. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Analyze workout and provide feedback using Gemini
 */
async function analyzeWorkout(userData, workout) {
  const prompt = `You are a workout analyst AI for ForgeArena.

User just completed:
- Exercise: ${workout.exercise}
- Reps: ${workout.reps}
- User Level: ${userData.avatar?.level || 1}
- Current Streak: ${userData.workoutStreak || 0} days

Provide brief, encouraging feedback (2 sentences max) on their workout. Mention stat impact if relevant. Do not use emojis.`;

  const response = await generateContent(prompt);
  return response;
}

/**
 * Get service status
 */
function getStatus() {
  return {
    available: isGeminiAvailable(),
    model: isGeminiAvailable() ? 'gemini-1.5-flash' : 'none',
    apiKeySet: !!process.env.GEMINI_API_KEY,
    sdkLoaded: !!GoogleGenerativeAI,
    freeTier: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
      tokensPerMonth: '1M'
    }
  };
}

module.exports = {
  initGemini,
  isGeminiAvailable,
  generateContent,
  generateWorkoutRecommendation,
  generateMotivation,
  generateStrategyInsight,
  generateProgressAnalysis,
  generateQuestSuggestion,
  analyzeWorkout,
  getStatus
};

