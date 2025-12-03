import React, { useState, useEffect, useCallback } from 'react';
import './AICoach.css';

const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : (process.env.NODE_ENV === 'production' 
      ? '/api'
      : 'http://localhost:5000/api');

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

const AICoach: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [questSuggestions, setQuestSuggestions] = useState<QuestSuggestion | null>(null);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'coach' | 'predictions' | 'patterns'>('coach');

  const fetchMLData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [recsRes, predsRes, motivRes, questRes, patternsRes] = await Promise.all([
        fetch(`${API_BASE}/ml/recommendations`),
        fetch(`${API_BASE}/ml/predictions`),
        fetch(`${API_BASE}/ml/motivation`),
        fetch(`${API_BASE}/ml/quest-suggestions`),
        fetch(`${API_BASE}/ml/patterns`)
      ]);

      if (!recsRes.ok || !predsRes.ok || !motivRes.ok) {
        throw new Error('Failed to fetch AI coaching data');
      }

      setRecommendations(await recsRes.json());
      setPredictions(await predsRes.json());
      setMotivation(await motivRes.json());
      setQuestSuggestions(await questRes.json());
      setPatterns(await patternsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI Coach');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMLData();
  }, [fetchMLData]);

  const getExerciseEmoji = (exercise: string) => {
    const emojis: { [key: string]: string } = {
      squat: '🦵',
      pushup: '💪',
      pullup: '🏋️',
      run: '🏃'
    };
    return emojis[exercise] || '🎯';
  };

  const getStatEmoji = (stat: string) => {
    const emojis: { [key: string]: string } = {
      strength: '💪',
      endurance: '❤️',
      agility: '⚡'
    };
    return emojis[stat] || '📊';
  };

  const getConsistencyBadge = (consistency: string) => {
    const badges: { [key: string]: { label: string; color: string } } = {
      legendary: { label: '🏆 Legendary', color: '#ffd700' },
      dedicated: { label: '⭐ Dedicated', color: '#c0c0c0' },
      consistent: { label: '🎯 Consistent', color: '#cd7f32' },
      building: { label: '📈 Building', color: '#4a90d9' },
      starting: { label: '🌱 Starting', color: '#4caf50' },
      new_user: { label: '🆕 New', color: '#9c27b0' }
    };
    return badges[consistency] || badges.starting;
  };

  if (loading) {
    return (
      <div className="ai-coach-container">
        <div className="ai-coach-loading">
          <div className="ai-avatar-loading">🤖</div>
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
          <div className="error-icon">⚠️</div>
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
        <div className="ai-avatar">🤖</div>
        <div className="ai-info">
          <h2>ForgeMaster AI</h2>
          <p className="ai-subtitle">Your Personal Fitness Coach</p>
          <span className="ai-badge">Powered by ML</span>
        </div>
        <button onClick={fetchMLData} className="refresh-btn" title="Refresh recommendations">
          🔄
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="ai-nav-tabs">
        <button 
          className={`ai-nav-tab ${activeSection === 'coach' ? 'active' : ''}`}
          onClick={() => setActiveSection('coach')}
        >
          🎯 Today's Plan
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveSection('predictions')}
        >
          📈 Predictions
        </button>
        <button 
          className={`ai-nav-tab ${activeSection === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveSection('patterns')}
        >
          📊 Insights
        </button>
      </div>

      {/* Motivation Banner */}
      {motivation && (
        <div className="motivation-banner">
          <span className="motivation-emoji">{motivation.emoji}</span>
          <p className="motivation-message">{motivation.message}</p>
        </div>
      )}

      {/* Coach Section */}
      {activeSection === 'coach' && recommendations && (
        <div className="ai-section">
          {/* Primary Recommendation */}
          <div className="recommendation-card primary">
            <div className="recommendation-header">
              <span className="rec-emoji">
                {getExerciseEmoji(recommendations.primaryRecommendation.exercise)}
              </span>
              <div className="rec-title">
                <h3>Recommended Workout</h3>
                <span className="focus-badge">
                  {getStatEmoji(recommendations.focusArea)} Focus: {recommendations.focusArea}
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
                <span className="xp-icon">⭐</span>
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
                  <span className="alt-emoji">{getExerciseEmoji(workout.exercise)}</span>
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
            <span className="tip-icon">💡</span>
            <p>{recommendations.motivationalTip}</p>
          </div>

          {/* Quest Suggestion */}
          {questSuggestions?.topQuest && (
            <div className="quest-suggestion-card">
              <div className="quest-header">
                <span className="quest-icon">📜</span>
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
            <div className="prediction-icon">⬆️</div>
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
            <div className="prediction-icon">🔥</div>
            <div className="prediction-content">
              <h4>Streak Analysis</h4>
              <p className="prediction-main">{predictions.streakAnalysis.status}</p>
              <p className="prediction-detail">{predictions.streakAnalysis.recommendation}</p>
            </div>
          </div>

          {/* Stats Focus */}
          <div className="prediction-card stats">
            <div className="prediction-icon">📊</div>
            <div className="prediction-content">
              <h4>Stat Analysis</h4>
              <div className="stat-comparison">
                <div className="stat-item strongest">
                  <span className="stat-label">Strongest</span>
                  <span className="stat-value">
                    {getStatEmoji(predictions.statsFocus.strongest)} {predictions.statsFocus.strongest}
                  </span>
                </div>
                <div className="stat-item weakest">
                  <span className="stat-label">Needs Work</span>
                  <span className="stat-value">
                    {getStatEmoji(predictions.statsFocus.needsWork)} {predictions.statsFocus.needsWork}
                  </span>
                </div>
              </div>
              <p className="prediction-detail">{predictions.statsFocus.tip}</p>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="prediction-card weekly-goal">
            <div className="prediction-icon">🎯</div>
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
              <span className="fav-emoji">{getExerciseEmoji(patterns.favoriteExercise)}</span>
              <div className="fav-content">
                <h4>Favorite Exercise</h4>
                <p>{patterns.favoriteExercise.charAt(0).toUpperCase() + patterns.favoriteExercise.slice(1)}s</p>
              </div>
            </div>
          )}

          {/* Trend Indicator */}
          <div className={`trend-card ${patterns.trend}`}>
            <span className="trend-icon">
              {patterns.trend === 'improving' ? '📈' : 
               patterns.trend === 'declining' ? '📉' : '➡️'}
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
            <h4>🧠 AI Insights</h4>
            <ul className="insights-list">
              {patterns.insights.map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          {patterns.recommendations.length > 0 && (
            <div className="ai-recommendations-card">
              <h4>💡 Recommendations</h4>
              <ul className="recommendations-list">
                {patterns.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="ai-coach-footer">
        <p>🤖 ForgeMaster AI • 100% Free • No API Key Required</p>
      </div>
    </div>
  );
};

export default AICoach;

