/**
 * ML Data Collector Service for ForgeArena
 * 
 * Automatically collects live production data for ML improvement.
 * Uses logging infrastructure to gather data without additional cost.
 * 
 * Collected Data:
 * - User workout patterns
 * - ML recommendation interactions
 * - Prediction outcomes
 * - Agent execution metrics
 * - User engagement signals
 * 
 * 100% FREE - Uses existing logging and in-memory storage
 */

const logger = require('../../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * ML Data Collector
 */
class MLDataCollector {
  constructor() {
    // In-memory data stores (cleared on restart, but persisted to logs)
    this.workoutData = [];
    this.mlInteractions = [];
    this.predictionOutcomes = [];
    this.agentExecutions = [];
    this.userEngagementSignals = [];
    
    // Configuration
    this.maxInMemoryRecords = 10000;
    this.persistenceEnabled = true;
    this.dataDir = path.join(__dirname, '..', '..', 'data', 'ml');
    
    // Initialize data directory
    this.initDataDirectory();
    
    // Load any persisted data
    this.loadPersistedData();
  }

  /**
   * Initialize data directory
   */
  initDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        logger.info('ML data directory created', { path: this.dataDir });
      }
    } catch (error) {
      logger.warn('Could not create ML data directory', { error: error.message });
      this.persistenceEnabled = false;
    }
  }

  /**
   * Load persisted data from files
   */
  loadPersistedData() {
    if (!this.persistenceEnabled) return;

    try {
      const files = {
        workouts: 'workout_data.json',
        interactions: 'ml_interactions.json',
        predictions: 'prediction_outcomes.json',
        agents: 'agent_executions.json',
        engagement: 'engagement_signals.json'
      };

      Object.entries(files).forEach(([key, filename]) => {
        const filePath = path.join(this.dataDir, filename);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          switch (key) {
            case 'workouts':
              this.workoutData = data.slice(-this.maxInMemoryRecords);
              break;
            case 'interactions':
              this.mlInteractions = data.slice(-this.maxInMemoryRecords);
              break;
            case 'predictions':
              this.predictionOutcomes = data.slice(-this.maxInMemoryRecords);
              break;
            case 'agents':
              this.agentExecutions = data.slice(-this.maxInMemoryRecords);
              break;
            case 'engagement':
              this.userEngagementSignals = data.slice(-this.maxInMemoryRecords);
              break;
          }
        }
      });

      logger.info('ML data loaded from persistence', {
        workouts: this.workoutData.length,
        interactions: this.mlInteractions.length,
        predictions: this.predictionOutcomes.length
      });
    } catch (error) {
      logger.warn('Could not load persisted ML data', { error: error.message });
    }
  }

  /**
   * Persist data to files
   */
  persistData() {
    if (!this.persistenceEnabled) return;

    try {
      const files = {
        'workout_data.json': this.workoutData,
        'ml_interactions.json': this.mlInteractions,
        'prediction_outcomes.json': this.predictionOutcomes,
        'agent_executions.json': this.agentExecutions,
        'engagement_signals.json': this.userEngagementSignals
      };

      Object.entries(files).forEach(([filename, data]) => {
        const filePath = path.join(this.dataDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      });

      logger.debug('ML data persisted to files');
    } catch (error) {
      logger.warn('Could not persist ML data', { error: error.message });
    }
  }

  // ==========================================================================
  // Data Collection Methods
  // ==========================================================================

  /**
   * Collect workout data
   */
  collectWorkoutData(userId, workoutData) {
    const record = {
      userId,
      exercise: workoutData.exercise,
      reps: workoutData.reps,
      xpGained: workoutData.xpGained || workoutData.reps * 2,
      timestamp: new Date().toISOString(),
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours()
    };

    this.workoutData.push(record);
    this.trimIfNeeded('workoutData');

    logger.debug('Workout data collected', { userId, exercise: record.exercise });

    // Auto-persist periodically
    if (this.workoutData.length % 100 === 0) {
      this.persistData();
    }

    return record;
  }

  /**
   * Collect ML interaction data
   */
  collectMLInteraction(userId, interactionType, interactionData) {
    const record = {
      userId,
      type: interactionType,
      endpoint: interactionData.endpoint,
      data: interactionData.data || {},
      response: interactionData.response || {},
      timestamp: new Date().toISOString(),
      duration: interactionData.duration || 0
    };

    this.mlInteractions.push(record);
    this.trimIfNeeded('mlInteractions');

    logger.debug('ML interaction collected', { userId, type: interactionType });

    return record;
  }

  /**
   * Collect prediction outcome data
   */
  collectPredictionOutcome(userId, prediction, actualOutcome) {
    const record = {
      userId,
      predictionType: prediction.type,
      predictedValue: prediction.value,
      actualValue: actualOutcome.value,
      predictionTimestamp: prediction.timestamp,
      outcomeTimestamp: new Date().toISOString(),
      accurate: this.isPredictionAccurate(prediction, actualOutcome),
      accuracyScore: this.calculatePredictionAccuracy(prediction, actualOutcome)
    };

    this.predictionOutcomes.push(record);
    this.trimIfNeeded('predictionOutcomes');

    logger.debug('Prediction outcome collected', { 
      userId, 
      type: prediction.type,
      accurate: record.accurate 
    });

    return record;
  }

  /**
   * Collect agent execution data
   */
  collectAgentExecution(agentName, executionData) {
    const record = {
      agent: agentName,
      userId: executionData.userId,
      executionTime: executionData.executionTime,
      success: executionData.success !== false,
      actionsGenerated: executionData.actionsGenerated || 0,
      timestamp: new Date().toISOString()
    };

    this.agentExecutions.push(record);
    this.trimIfNeeded('agentExecutions');

    logger.debug('Agent execution collected', { agent: agentName });

    return record;
  }

  /**
   * Collect user engagement signal
   */
  collectEngagementSignal(userId, signalType, signalData) {
    const record = {
      userId,
      signalType,
      data: signalData,
      timestamp: new Date().toISOString()
    };

    this.userEngagementSignals.push(record);
    this.trimIfNeeded('userEngagementSignals');

    logger.debug('Engagement signal collected', { userId, signalType });

    return record;
  }

  // ==========================================================================
  // Data Retrieval Methods
  // ==========================================================================

  /**
   * Get production data for ML assessment
   */
  getProductionData() {
    return {
      workouts: this.workoutData,
      mlInteractions: this.mlInteractions,
      predictions: this.predictionOutcomes,
      agentExecutions: this.agentExecutions,
      engagementSignals: this.userEngagementSignals,
      collectedAt: new Date().toISOString(),
      stats: this.getCollectionStats()
    };
  }

  /**
   * Get production data with user context
   */
  async getProductionDataWithUsers(userService) {
    const data = this.getProductionData();
    
    // Try to get user data
    try {
      if (userService && typeof userService.getAllUsers === 'function') {
        const users = await userService.getAllUsers();
        data.users = users;
      } else {
        // Extract unique users from collected data
        const userIds = new Set([
          ...this.workoutData.map(w => w.userId),
          ...this.mlInteractions.map(i => i.userId),
          ...this.userEngagementSignals.map(s => s.userId)
        ].filter(Boolean));
        
        data.users = Array.from(userIds).map(uid => ({ uid }));
      }
    } catch (error) {
      logger.warn('Could not fetch user data for ML assessment', { error: error.message });
      data.users = [];
    }

    return data;
  }

  /**
   * Get collection statistics
   */
  getCollectionStats() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const countRecent = (data, since) => 
      data.filter(r => new Date(r.timestamp) > since).length;

    return {
      total: {
        workouts: this.workoutData.length,
        mlInteractions: this.mlInteractions.length,
        predictions: this.predictionOutcomes.length,
        agentExecutions: this.agentExecutions.length,
        engagementSignals: this.userEngagementSignals.length
      },
      last24Hours: {
        workouts: countRecent(this.workoutData, oneDayAgo),
        mlInteractions: countRecent(this.mlInteractions, oneDayAgo),
        agentExecutions: countRecent(this.agentExecutions, oneDayAgo)
      },
      lastWeek: {
        workouts: countRecent(this.workoutData, oneWeekAgo),
        mlInteractions: countRecent(this.mlInteractions, oneWeekAgo),
        agentExecutions: countRecent(this.agentExecutions, oneWeekAgo)
      },
      uniqueUsers: this.getUniqueUserCount(),
      dataQuality: this.assessDataQuality()
    };
  }

  /**
   * Get unique user count
   */
  getUniqueUserCount() {
    const userIds = new Set([
      ...this.workoutData.map(w => w.userId),
      ...this.mlInteractions.map(i => i.userId),
      ...this.userEngagementSignals.map(s => s.userId)
    ].filter(Boolean));

    return userIds.size;
  }

  /**
   * Assess data quality
   */
  assessDataQuality() {
    const totalRecords = this.workoutData.length + 
                        this.mlInteractions.length + 
                        this.predictionOutcomes.length;

    if (totalRecords === 0) return { score: 0, status: 'no_data' };
    if (totalRecords < 10) return { score: 20, status: 'minimal' };
    if (totalRecords < 50) return { score: 40, status: 'developing' };
    if (totalRecords < 200) return { score: 60, status: 'moderate' };
    if (totalRecords < 1000) return { score: 80, status: 'good' };
    return { score: 100, status: 'excellent' };
  }

  // ==========================================================================
  // Analytics Methods
  // ==========================================================================

  /**
   * Get workout analytics
   */
  getWorkoutAnalytics() {
    if (this.workoutData.length === 0) {
      return { message: 'No workout data collected yet' };
    }

    // Exercise distribution
    const exerciseCounts = {};
    let totalReps = 0;
    const hourDistribution = new Array(24).fill(0);
    const dayDistribution = new Array(7).fill(0);

    this.workoutData.forEach(w => {
      exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + 1;
      totalReps += w.reps || 0;
      hourDistribution[w.hourOfDay] = (hourDistribution[w.hourOfDay] || 0) + 1;
      dayDistribution[w.dayOfWeek] = (dayDistribution[w.dayOfWeek] || 0) + 1;
    });

    // Find peak times
    const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
    const peakDay = dayDistribution.indexOf(Math.max(...dayDistribution));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      totalWorkouts: this.workoutData.length,
      totalReps,
      averageReps: Math.round(totalReps / this.workoutData.length),
      exerciseDistribution: exerciseCounts,
      mostPopularExercise: Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
      peakWorkoutHour: `${peakHour}:00`,
      peakWorkoutDay: dayNames[peakDay],
      hourDistribution,
      dayDistribution
    };
  }

  /**
   * Get ML interaction analytics
   */
  getMLInteractionAnalytics() {
    if (this.mlInteractions.length === 0) {
      return { message: 'No ML interactions collected yet' };
    }

    const typeCounts = {};
    let totalDuration = 0;

    this.mlInteractions.forEach(i => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
      totalDuration += i.duration || 0;
    });

    return {
      totalInteractions: this.mlInteractions.length,
      interactionTypes: typeCounts,
      averageResponseTime: Math.round(totalDuration / this.mlInteractions.length),
      mostUsedFeature: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    };
  }

  /**
   * Get prediction analytics
   */
  getPredictionAnalytics() {
    if (this.predictionOutcomes.length === 0) {
      return { message: 'No prediction outcomes collected yet' };
    }

    const accurateCount = this.predictionOutcomes.filter(p => p.accurate).length;
    const avgAccuracy = this.predictionOutcomes.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) 
                       / this.predictionOutcomes.length;

    const byType = {};
    this.predictionOutcomes.forEach(p => {
      if (!byType[p.predictionType]) {
        byType[p.predictionType] = { total: 0, accurate: 0 };
      }
      byType[p.predictionType].total++;
      if (p.accurate) byType[p.predictionType].accurate++;
    });

    return {
      totalPredictions: this.predictionOutcomes.length,
      accuratePredictions: accurateCount,
      accuracyRate: Math.round((accurateCount / this.predictionOutcomes.length) * 100),
      averageAccuracyScore: Math.round(avgAccuracy * 100),
      byType
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Check if prediction was accurate
   */
  isPredictionAccurate(prediction, actual) {
    const predicted = prediction.value;
    const actualVal = actual.value;
    
    if (typeof predicted === 'number' && typeof actualVal === 'number') {
      // Within 30% is considered accurate
      const threshold = Math.max(predicted, actualVal) * 0.3;
      return Math.abs(predicted - actualVal) <= threshold;
    }
    
    return predicted === actualVal;
  }

  /**
   * Calculate prediction accuracy score (0-1)
   */
  calculatePredictionAccuracy(prediction, actual) {
    const predicted = prediction.value;
    const actualVal = actual.value;
    
    if (typeof predicted === 'number' && typeof actualVal === 'number') {
      if (predicted === 0 && actualVal === 0) return 1;
      const maxVal = Math.max(Math.abs(predicted), Math.abs(actualVal));
      return Math.max(0, 1 - (Math.abs(predicted - actualVal) / maxVal));
    }
    
    return predicted === actualVal ? 1 : 0;
  }

  /**
   * Trim data arrays if needed
   */
  trimIfNeeded(arrayName) {
    if (this[arrayName].length > this.maxInMemoryRecords) {
      this[arrayName] = this[arrayName].slice(-this.maxInMemoryRecords);
    }
  }

  /**
   * Clear all collected data
   */
  clearData() {
    this.workoutData = [];
    this.mlInteractions = [];
    this.predictionOutcomes = [];
    this.agentExecutions = [];
    this.userEngagementSignals = [];
    
    logger.info('ML data collector cleared');
    
    if (this.persistenceEnabled) {
      this.persistData();
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      status: 'operational',
      persistenceEnabled: this.persistenceEnabled,
      dataDir: this.dataDir,
      stats: this.getCollectionStats(),
      memoryUsage: {
        workouts: this.workoutData.length,
        interactions: this.mlInteractions.length,
        predictions: this.predictionOutcomes.length,
        agents: this.agentExecutions.length,
        engagement: this.userEngagementSignals.length,
        maxRecords: this.maxInMemoryRecords
      }
    };
  }
}

// Export singleton instance
const mlDataCollector = new MLDataCollector();

module.exports = {
  mlDataCollector,
  MLDataCollector
};

