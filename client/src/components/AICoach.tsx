import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../utils/api';
import './AICoach.css';

interface WorkoutRecommendation {
  exercise: string;
  reps: number;
  reason: string;
}

interface Recommendations {
  success: boolean;
  source: string;
  primaryRecommendation: WorkoutRecommendation;
  alternativeWorkouts: { exercise: string; reps: number }[];
  motivationalTip: string;
  predictedXP: number;
  focusArea: string;
}

interface Predictions {
  success: boolean;
  levelUpPrediction: {
    currentLevel: number;
    xpNeeded: number;
    daysUntil: number;
    confidence: string;
  };
  streakAnalysis: {
    currentStreak: number;
    status: string;
    recommendation: string;
  };
  statsFocus: {
    strongest: string;
    needsWork: string;
    tip: string;
  };
  weeklyGoal: {
    exercise: string;
    target: number;
    xpReward: number;
  };
  motivationalMessage: string;
}

interface Motivation {
  success: boolean;
  message: string;
  emoji: string;
  actionPrompt: string;
}

interface QuestSuggestion {
  success: boolean;
  topQuest: {
    id: number;
    title: string;
    reason: string;
  } | null;
  strategyTip: string;
}

interface PatternAnalysis {
  success: boolean;
  totalWorkouts: number;
  favoriteExercise: string | null;
  averageReps: number;
  consistency: string;
  trend: string;
  insights: string[];
  recommendations: string[];
}

// Agent-specific interfaces
interface AgentAnalysis {
  success: boolean;
  source: string;
  executionTime: number;
  orchestration: {
    agentsExecuted: string[];
    executionTime: string;
  };
  strategy: {
    agent: string;
    trainingFocus: {
      primary: string;
      reason: string;
    };
    weeklyPlan: {
      [key: string]: {
        type: string;
        exercises?: Array<{
          exercise: string;
          name: string;
          sets: number;
          reps: number;
          xpPotential: number;
        }>;
        reason?: string;
        totalXpPotential?: number;
      };
    };
    repRanges: {
      beginner: { min: number; max: number; recommendation: string };
      standard: { min: number; max: number; recommendation: string };
      challenge: { min: number; max: number; recommendation: string };
    };
    strategyRecommendations: Array<{
      type: string;
      priority: string;
      message: string;
      action: string;
    }>;
  };
  motivation: {
    agent: string;
    primaryMessage: string;
    tone: string;
    additionalEncouragement: string[];
    callToAction: string;
  };
  progress: {
    agent: string;
    progressMetrics: {
      currentLevel: number;
      workoutsThisWeek: number;
      streak: number;
      levelProgress: number;
    };
    progressScore: number;
    trends: {
      overallTrend: string;
      repsTrend: string;
    };
    areasForImprovement: Array<{
      area: string;
      priority: string;
      suggestion: string;
      actionable: string;
    }>;
  };
  synthesis: {
    healthScore: {
      overall: number;
      grade: string;
      consistency: number;
      balance: number;
      progress: number;
    };
    keyInsight: string;
    unifiedRecommendations: Array<{
      source: string;
      type: string;
      priority: string;
      message: string;
      action: string;
    }>;
  };
  automatedActions?: {
    enabled: boolean;
    count: number;
    actions: Array<{
      type: string;
      value: unknown;
    }>;
  };
  actionResults?: {
    successful: number;
    failed: number;
  };
}

interface MLAssessment {
  success: boolean;
  assessment: {
    overallScore: number;
    grade: string;
    benchmarkComparison: {
      [key: string]: {
        score: number;
        benchmark: number;
        meetsBenchmark: boolean;
        status: string;
      };
    };
    recommendations: Array<{
      metric: string;
      priority: string;
      suggestion: string;
    }>;
  };
}

const AICoach: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [questSuggestions, setQuestSuggestions] = useState<QuestSuggestion | null>(null);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [agentAnalysis, setAgentAnalysis] = useState<AgentAnalysis | null>(null);
  const [mlAssessment, setMlAssessment] = useState<MLAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'coach' | 'predictions' | 'patterns' | 'agents' | 'assessment'>('coach');
  const [actionsEnabled, setActionsEnabled] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMLData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [recs, preds, motiv, quest, patternsData] = await Promise.all([
        apiGet('/api/ml/recommendations'),
        apiGet('/api/ml/predictions'),
        apiGet('/api/ml/motivation'),
        apiGet('/api/ml/quest-suggestions'),
        apiGet('/api/ml/patterns')
      ]);

      setRecommendations(recs);
      setPredictions(preds);
      setMotivation(motiv);
      setQuestSuggestions(quest);
      setPatterns(patternsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI Coach');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAgentAnalysis = useCallback(async () => {
    setAgentLoading(true);
    try {
      const analysis = await apiGet(`/api/ml/agents/analyze?takeActions=${actionsEnabled}`);
      setAgentAnalysis(analysis);
      
      if (analysis.actionResults && analysis.actionResults.successful > 0) {
        setActionMessage(`✓ ${analysis.actionResults.successful} automated actions executed successfully!`);
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to fetch agent analysis:', err);
    } finally {
      setAgentLoading(false);
    }
  }, [actionsEnabled]);

  const fetchMLAssessment = useCallback(async () => {
    try {
      const assessment = await apiGet('/api/ml/assessment/run');
      setMlAssessment(assessment);
    } catch (err) {
      console.error('Failed to fetch ML assessment:', err);
    }
  }, []);

  useEffect(() => {
    fetchMLData();
  }, [fetchMLData]);

  useEffect(() => {
    if (activeSection === 'agents' && !agentAnalysis) {
      fetchAgentAnalysis();
    }
    if (activeSection === 'assessment' && !mlAssessment) {
      fetchMLAssessment();
    }
  }, [activeSection, agentAnalysis, mlAssessment, fetchAgentAnalysis, fetchMLAssessment]);

  const getExerciseLabel = (exercise: string) => {
    const labels: { [key: string]: string } = {
      squat: 'SQUAT',
      pushup: 'PUSH',
      pullup: 'PULL',
      run: 'RUN',
      plank: 'PLANK',
      burpee: 'BURPEE'
    };
    return labels[exercise] || 'WORKOUT';
  };

  const getStatLabel = (stat: string) => {
    const labels: { [key: string]: string } = {
      strength: 'STR',
      endurance: 'END',
      agility: 'AGI'
    };
    return labels[stat] || 'STAT';
  };

  const getConsistencyBadge = (consistency: string) => {
    const badges: { [key: string]: { label: string; color: string } } = {
      legendary: { label: 'Legendary', color: '#ffd700' },
      dedicated: { label: 'Dedicated', color: '#c0c0c0' },
      consistent: { label: 'Consistent', color: '#cd7f32' },
      building: { label: 'Building', color: '#4a90d9' },
      starting: { label: 'Starting', color: '#4caf50' },
      new_user: { label: 'New', color: '#9c27b0' }
    };
    return badges[consistency] || badges.starting;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#22c55e';
    if (grade.startsWith('B')) return '#84cc16';
    if (grade.startsWith('C')) return '#f59e0b';
    if (grade.startsWith('D')) return '#ef4444';
    return '#dc2626';
  };

  if (loading) {
    return (
      <div className="ai-coach-container">
        <div className="ai-coach-loading">
          <div className="ai-avatar-loading">AI</div>
          <h2>ForgeMaster AI is analyzing your profile...</h2>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-coach-container">
        <div className="ai-coach-error">
          <div className="error-icon">!</div>
          <h2>AI Coach Unavailable</h2>
          <p>{error}</p>
          <button onClick={fetchMLData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-coach-container">
      {/* AI Coach Header */}
      <div className="ai-coach-header">
        <div className="ai-avatar">AI</div>
        <div className="ai-info">
          <h2>ForgeMaster AI</h2>
          <p className="ai-subtitle">Your Personal Fitness Coach</p>
          <div className="ai-badges">
            <span className="ai-badge">Multi-Agent System v2.1</span>
            {agentAnalysis?.orchestration?.strategy?.aiEnhanced && (
              <span className="ai-badge gemini-badge">Gemini Enhanced</span>
            )}
          </div>
        </div>
        <button onClick={fetchMLData} className="refresh-btn" title="Refresh recommendations">
          Refresh
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="action-message success">
          {actionMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ai-nav-tabs">
        <button 
          className={`ai-nav-tab ${activeSection === 'coach' ? 'active' : ''}`}
          onClick={() => setActiveSection('coach')}
        >
          Today's Plan
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveSection('predictions')}
        >
          Predictions
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveSection('patterns')}
        >
          Insights
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveSection('agents')}
        >
          Agents
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveSection('assessment')}
        >
          Assessment
        </button>
      </div>

      {/* Motivation Banner */}
      {motivation && activeSection !== 'agents' && activeSection !== 'assessment' && (
        <div className="motivation-banner">
          <p className="motivation-message">{motivation.message}</p>
        </div>
      )}

      {/* Coach Section */}
      {activeSection === 'coach' && recommendations && (
        <div className="ai-section">
          {/* Primary Recommendation */}
          <div className="recommendation-card primary">
            <div className="recommendation-header">
              <span className="rec-label">
                {getExerciseLabel(recommendations.primaryRecommendation.exercise)}
              </span>
              <div className="rec-title">
                <h3>Recommended Workout</h3>
                <span className="focus-badge">
                  {getStatLabel(recommendations.focusArea)} Focus: {recommendations.focusArea}
                </span>
              </div>
            </div>
            <div className="recommendation-body">
              <div className="exercise-name">
                {recommendations.primaryRecommendation.exercise.charAt(0).toUpperCase() + 
                 recommendations.primaryRecommendation.exercise.slice(1)}s
              </div>
              <div className="rep-count">
                <span className="rep-number">{recommendations.primaryRecommendation.reps}</span>
                <span className="rep-label">reps</span>
              </div>
              <p className="rec-reason">{recommendations.primaryRecommendation.reason}</p>
              <div className="xp-preview">
                <span className="xp-icon">XP</span>
                <span className="xp-amount">+{recommendations.predictedXP} XP</span>
              </div>
            </div>
          </div>

          {/* Alternative Workouts */}
          <div className="alternatives-section">
            <h4>Alternative Exercises</h4>
            <div className="alternatives-grid">
              {recommendations.alternativeWorkouts.map((workout, index) => (
                <div key={index} className="alternative-card">
                  <span className="alt-label">{getExerciseLabel(workout.exercise)}</span>
                  <span className="alt-name">
                    {workout.exercise.charAt(0).toUpperCase() + workout.exercise.slice(1)}s
                  </span>
                  <span className="alt-reps">{workout.reps} reps</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Tip */}
          <div className="tip-card">
            <span className="tip-icon">TIP</span>
            <p>{recommendations.motivationalTip}</p>
          </div>

          {/* Quest Suggestion */}
          {questSuggestions?.topQuest && (
            <div className="quest-suggestion-card">
              <div className="quest-header">
                <span className="quest-icon">QUEST</span>
                <h4>Recommended Quest</h4>
              </div>
              <div className="quest-body">
                <p className="quest-title">{questSuggestions.topQuest.title}</p>
                <p className="quest-reason">{questSuggestions.topQuest.reason}</p>
              </div>
              <p className="strategy-tip">{questSuggestions.strategyTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Predictions Section */}
      {activeSection === 'predictions' && predictions && (
        <div className="ai-section">
          {/* Level Up Prediction */}
          <div className="prediction-card level-up">
            <div className="prediction-icon">LVL</div>
            <div className="prediction-content">
              <h4>Level Up Prediction</h4>
              <p className="prediction-main">
                <span className="highlight">{predictions.levelUpPrediction.daysUntil}</span> days
                to Level {predictions.levelUpPrediction.currentLevel + 1}
              </p>
              <p className="prediction-detail">
                {predictions.levelUpPrediction.xpNeeded} XP needed
              </p>
              <span className={`confidence-badge ${predictions.levelUpPrediction.confidence}`}>
                {predictions.levelUpPrediction.confidence} confidence
              </span>
            </div>
          </div>

          {/* Streak Analysis */}
          <div className="prediction-card streak">
            <div className="prediction-icon">STREAK</div>
            <div className="prediction-content">
              <h4>Streak Analysis</h4>
              <p className="prediction-main">{predictions.streakAnalysis.status}</p>
              <p className="prediction-detail">{predictions.streakAnalysis.recommendation}</p>
            </div>
          </div>

          {/* Stats Focus */}
          <div className="prediction-card stats">
            <div className="prediction-icon">STATS</div>
            <div className="prediction-content">
              <h4>Stat Analysis</h4>
              <div className="stat-comparison">
                <div className="stat-item strongest">
                  <span className="stat-label">Strongest</span>
                  <span className="stat-value">
                    {getStatLabel(predictions.statsFocus.strongest)} {predictions.statsFocus.strongest}
                  </span>
                </div>
                <div className="stat-item weakest">
                  <span className="stat-label">Needs Work</span>
                  <span className="stat-value">
                    {getStatLabel(predictions.statsFocus.needsWork)} {predictions.statsFocus.needsWork}
                  </span>
                </div>
              </div>
              <p className="prediction-detail">{predictions.statsFocus.tip}</p>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="prediction-card weekly-goal">
            <div className="prediction-icon">GOAL</div>
            <div className="prediction-content">
              <h4>Weekly Goal</h4>
              <p className="prediction-main">
                {predictions.weeklyGoal.target} {predictions.weeklyGoal.exercise}s
              </p>
              <p className="prediction-detail">
                Complete for <span className="xp-reward">+{predictions.weeklyGoal.xpReward} XP</span>
              </p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="motivation-card">
            <p>"{predictions.motivationalMessage}"</p>
            <span className="motivation-author">— ForgeMaster AI</span>
          </div>
        </div>
      )}

      {/* Patterns Section */}
      {activeSection === 'patterns' && patterns && (
        <div className="ai-section">
          {/* Summary Stats */}
          <div className="patterns-summary">
            <div className="summary-stat">
              <span className="summary-value">{patterns.totalWorkouts}</span>
              <span className="summary-label">Total Workouts</span>
            </div>
            <div className="summary-stat">
              <span className="summary-value">{patterns.averageReps}</span>
              <span className="summary-label">Avg Reps</span>
            </div>
            <div className="summary-stat">
              <span 
                className="summary-value badge"
                style={{ backgroundColor: getConsistencyBadge(patterns.consistency).color }}
              >
                {getConsistencyBadge(patterns.consistency).label}
              </span>
              <span className="summary-label">Status</span>
            </div>
          </div>

          {/* Favorite Exercise */}
          {patterns.favoriteExercise && (
            <div className="favorite-exercise-card">
              <span className="fav-label">{getExerciseLabel(patterns.favoriteExercise)}</span>
              <div className="fav-content">
                <h4>Favorite Exercise</h4>
                <p>{patterns.favoriteExercise.charAt(0).toUpperCase() + patterns.favoriteExercise.slice(1)}s</p>
              </div>
            </div>
          )}

          {/* Trend Indicator */}
          <div className={`trend-card ${patterns.trend}`}>
            <span className="trend-icon">
              {patterns.trend === 'improving' ? 'UP' : 
               patterns.trend === 'declining' ? 'DOWN' : 'STEADY'}
            </span>
            <div className="trend-content">
              <h4>Performance Trend</h4>
              <p className="trend-status">
                {patterns.trend === 'improving' ? 'Getting Stronger!' :
                 patterns.trend === 'declining' ? 'Time to Push Harder!' :
                 'Steady Progress'}
              </p>
            </div>
          </div>

          {/* Insights */}
          <div className="insights-card">
            <h4>AI Insights</h4>
            <ul className="insights-list">
              {patterns.insights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          {patterns.recommendations.length > 0 && (
            <div className="ai-recommendations-card">
              <h4>Recommendations</h4>
              <ul className="recommendations-list">
                {patterns.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Agents Section - NEW */}
      {activeSection === 'agents' && (
        <div className="ai-section agents-section">
          {/* Agent Controls */}
          <div className="agent-controls">
            <div className="agent-toggle">
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  checked={actionsEnabled}
                  onChange={(e) => setActionsEnabled(e.target.checked)}
                />
                <span className="toggle-text">Enable Automated Actions</span>
              </label>
              <p className="toggle-hint">
                When enabled, AI agents will automatically set goals and create quests for you
              </p>
            </div>
            <button 
              onClick={fetchAgentAnalysis} 
              className="agent-refresh-btn"
              disabled={agentLoading}
            >
              {agentLoading ? 'Analyzing...' : 'Run Agent Analysis'}
            </button>
          </div>

          {agentLoading ? (
            <div className="agent-loading">
              <div className="agent-spinner"></div>
              <p>AI Agents are collaborating...</p>
              <p className="agent-subtext">Training Strategist • Motivation Coach • Progress Analyst</p>
            </div>
          ) : agentAnalysis ? (
            <>
              {/* Health Score */}
              <div className="health-score-card">
                <div className="health-score-header">
                  <h3>Fitness Health Score</h3>
                  <div 
                    className="health-grade"
                    style={{ backgroundColor: getGradeColor(agentAnalysis.synthesis.healthScore.grade) }}
                  >
                    {agentAnalysis.synthesis.healthScore.grade}
                  </div>
                </div>
                <div className="health-score-bar">
                  <div 
                    className="health-score-fill"
                    style={{ width: `${agentAnalysis.synthesis.healthScore.overall}%` }}
                  ></div>
                </div>
                <p className="health-score-value">{agentAnalysis.synthesis.healthScore.overall}/100</p>
                <div className="health-breakdown">
                  <div className="breakdown-item">
                    <span>Consistency</span>
                    <span>{Math.round(agentAnalysis.synthesis.healthScore.consistency)}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Balance</span>
                    <span>{Math.round(agentAnalysis.synthesis.healthScore.balance)}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Progress</span>
                    <span>{agentAnalysis.synthesis.healthScore.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Key Insight */}
              <div className="key-insight-card">
                <span className="insight-icon">TIP</span>
                <p>{agentAnalysis.synthesis.keyInsight}</p>
              </div>

              {/* Agent Motivation */}
              <div className="agent-motivation-card">
                <div className="motivation-header">
                  <span className="agent-badge">Motivation Coach</span>
                  <span className="tone-badge">{agentAnalysis.motivation.tone}</span>
                </div>
                <p className="motivation-text">{agentAnalysis.motivation.primaryMessage}</p>
                {agentAnalysis.motivation.additionalEncouragement.length > 0 && (
                  <div className="encouragements">
                    {agentAnalysis.motivation.additionalEncouragement.map((enc, i) => (
                      <span key={i} className="encouragement-badge">{enc}</span>
                    ))}
                  </div>
                )}
                <button className="cta-button">{agentAnalysis.motivation.callToAction}</button>
              </div>

              {/* Weekly Training Plan */}
              <div className="weekly-plan-card">
                <div className="plan-header">
                  <span className="agent-badge">Training Strategist</span>
                  <span className="focus-badge">{agentAnalysis.strategy.trainingFocus.primary} focus</span>
                </div>
                <p className="plan-reason">{agentAnalysis.strategy.trainingFocus.reason}</p>
                <div className="weekly-schedule">
                  {Object.entries(agentAnalysis.strategy.weeklyPlan).slice(0, 7).map(([day, plan]) => (
                    <div key={day} className={`day-plan ${plan.type}`}>
                      <span className="day-name">{day.slice(0, 3)}</span>
                      {plan.type === 'rest' ? (
                        <span className="rest-badge">REST</span>
                      ) : (
                        <div className="day-exercises">
                          {plan.exercises?.slice(0, 2).map((ex, i) => (
                            <span key={i} className="exercise-mini">
                              {getExerciseLabel(ex.exercise)} ×{ex.reps}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Analysis */}
              <div className="progress-analysis-card">
                <div className="analysis-header">
                  <span className="agent-badge">Progress Analyst</span>
                  <span className="score-badge">Score: {agentAnalysis.progress.progressScore}/100</span>
                </div>
                <div className="progress-metrics">
                  <div className="metric">
                    <span className="metric-value">{agentAnalysis.progress.progressMetrics.workoutsThisWeek}</span>
                    <span className="metric-label">This Week</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{agentAnalysis.progress.progressMetrics.streak}</span>
                    <span className="metric-label">Day Streak</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{agentAnalysis.progress.progressMetrics.levelProgress}%</span>
                    <span className="metric-label">To Next Level</span>
                  </div>
                </div>
                <div className={`trend-indicator ${agentAnalysis.progress.trends.overallTrend}`}>
                  Trend: {agentAnalysis.progress.trends.overallTrend === 'improving' ? 'Improving' :
                          agentAnalysis.progress.trends.overallTrend === 'declining' ? 'Declining' : 'Stable'}
                </div>
              </div>

              {/* Unified Recommendations */}
              {agentAnalysis.synthesis.unifiedRecommendations.length > 0 && (
                <div className="unified-recommendations-card">
                  <h4>Priority Actions</h4>
                  <div className="recommendations-list">
                    {agentAnalysis.synthesis.unifiedRecommendations.slice(0, 3).map((rec, i) => (
                      <div key={i} className="recommendation-item">
                        <span 
                          className="priority-dot"
                          style={{ backgroundColor: getPriorityColor(rec.priority) }}
                        ></span>
                        <div className="rec-content">
                          <p className="rec-message">{rec.message}</p>
                          <p className="rec-action">{rec.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automated Actions Status */}
              {agentAnalysis.automatedActions && agentAnalysis.automatedActions.enabled && (
                <div className="automated-actions-card">
                  <h4>Automated Actions</h4>
                  <p className="actions-count">{agentAnalysis.automatedActions.count} actions generated</p>
                  {agentAnalysis.actionResults && (
                    <div className="action-results">
                      <span className="success">✓ {agentAnalysis.actionResults.successful} successful</span>
                      {agentAnalysis.actionResults.failed > 0 && (
                        <span className="failed">✗ {agentAnalysis.actionResults.failed} failed</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="agent-intro">
              <h3>Multi-Agent AI System</h3>
              <p>Our advanced AI uses multiple specialized agents that work together:</p>
              <div className="agent-list">
                <div className="agent-item">
                  <span className="agent-emoji">S</span>
                  <div>
                    <strong>Training Strategist</strong>
                    <p>Creates personalized weekly workout plans</p>
                  </div>
                </div>
                <div className="agent-item">
                  <span className="agent-emoji">M</span>
                  <div>
                    <strong>Motivation Coach</strong>
                    <p>Generates contextual encouragement</p>
                  </div>
                </div>
                <div className="agent-item">
                  <span className="agent-emoji">P</span>
                  <div>
                    <strong>Progress Analyst</strong>
                    <p>Evaluates trends and identifies improvements</p>
                  </div>
                </div>
                <div className="agent-item">
                  <span className="agent-emoji">G</span>
                  <div>
                    <strong>Goal Coordinator</strong>
                    <p>Orchestrates agents and automates actions</p>
                  </div>
                </div>
              </div>
              <button onClick={fetchAgentAnalysis} className="start-analysis-btn">
                Start Agent Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Assessment Section - NEW */}
      {activeSection === 'assessment' && (
        <div className="ai-section assessment-section">
          <div className="assessment-header">
            <h3>ML Performance Assessment</h3>
            <p>Automated evaluation of AI system performance using production data</p>
            <button onClick={fetchMLAssessment} className="run-assessment-btn">
              Run Assessment
            </button>
          </div>

          {mlAssessment?.assessment ? (
            <>
              {/* Overall Score */}
              <div className="assessment-score-card">
                <div className="score-circle" style={{ 
                  borderColor: getGradeColor(mlAssessment.assessment.grade) 
                }}>
                  <span className="score-value">{mlAssessment.assessment.overallScore}</span>
                  <span className="score-grade">{mlAssessment.assessment.grade}</span>
                </div>
                <div className="score-info">
                  <h4>Overall ML Score</h4>
                  <p>Based on 5 key performance metrics</p>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="benchmarks-card">
                <h4>Performance Benchmarks</h4>
                <div className="benchmarks-grid">
                  {Object.entries(mlAssessment.assessment.benchmarkComparison).map(([metric, data]) => (
                    <div key={metric} className={`benchmark-item ${data.meetsBenchmark ? 'pass' : 'fail'}`}>
                      <div className="benchmark-header">
                        <span className="metric-name">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`status-badge ${data.status.toLowerCase()}`}>
                          {data.status}
                        </span>
                      </div>
                      <div className="benchmark-bar">
                        <div 
                          className="benchmark-fill"
                          style={{ width: `${Math.min(data.score, 100)}%` }}
                        ></div>
                        <div 
                          className="benchmark-target"
                          style={{ left: `${data.benchmark}%` }}
                        ></div>
                      </div>
                      <div className="benchmark-values">
                        <span>Score: {data.score}%</span>
                        <span>Target: {data.benchmark}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvement Recommendations */}
              {mlAssessment.assessment.recommendations.length > 0 && (
                <div className="improvement-recommendations-card">
                  <h4>🔧 Improvement Areas</h4>
                  {mlAssessment.assessment.recommendations.map((rec, i) => (
                    <div key={i} className="improvement-item">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(rec.priority) }}
                      >
                        {rec.priority}
                      </span>
                      <div className="improvement-content">
                        <strong>{rec.metric.replace(/([A-Z])/g, ' $1').trim()}</strong>
                        <p>{rec.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="assessment-intro">
              <p>Click "Run Assessment" to evaluate the ML system's performance.</p>
              <p className="assessment-note">
                Assessment uses live production data to measure recommendation relevance,
                prediction accuracy, user engagement, and more.
              </p>
            </div>
          )}

          <div className="assessment-footer">
            <p>All assessments are automated and run against real production data</p>
            <p>100% Free - No external API costs</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="ai-coach-footer">
        <p>ForgeMaster AI v2.0 - Multi-Agent System - 100% Free</p>
      </div>
    </div>
  );
};

export default AICoach;
