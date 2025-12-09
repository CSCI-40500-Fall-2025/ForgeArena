import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import './RaidScreen.css';

// Types
interface Boss {
  id: string;
  name: string;
  flavorText: string;
  baseHp: number;
  hpPerMember: number;
  minMembers: number;
  maxMembers: number;
  difficulty: 'normal' | 'hard' | 'legendary';
  imageUrl: string;
  color: string;
  scaledHp: number;
  isAvailable: boolean;
  rewards: {
    xpPerMember: number;
    bonusXpForTopContributor: number;
  };
}

interface Contribution {
  userId: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  totalDamage: number;
  totalHits: number;
  rank?: number;
  damagePercentage?: string;
}

interface DamageLogEntry {
  userId: string;
  username: string;
  damage: number;
  source: string;
  timestamp: string;
}

interface Raid {
  id: string;
  partyId: string;
  partyName: string;
  bossId: string;
  bossName: string;
  bossFlavorText: string;
  bossColor: string;
  bossDifficulty: string;
  hpTotal: number;
  hpRemaining: number;
  memberCount: number;
  contributions: Record<string, Contribution>;
  leaderboard?: Contribution[];
  damageLog: DamageLogEntry[];
  status: 'active' | 'completed' | 'abandoned';
  victory?: boolean;
  startedAt: string;
  updatedAt: string;
}

interface Party {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
}

const RaidScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Data state
  const [party, setParty] = useState<Party | null>(null);
  const [raid, setRaid] = useState<Raid | null>(null);
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  
  // Workout form for dealing damage
  const [workoutForm, setWorkoutForm] = useState({ exercise: 'squat', reps: 10 });
  
  // Animation states
  const [damageFlash, setDamageFlash] = useState(false);
  const [recentDamage, setRecentDamage] = useState<number | null>(null);
  const prevHpRef = useRef<number | null>(null);
  
  // Polling for real-time updates
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLL_INTERVAL = 2000; // 2 seconds for <2s requirement

  // Show message helper
  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch active raid and party status
  const fetchRaidStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await apiGet('/api/raids/active');
      
      setParty(response.party);
      
      if (response.raid) {
        // Check for HP change animation
        if (prevHpRef.current !== null && response.raid.hpRemaining < prevHpRef.current) {
          const damageTaken = prevHpRef.current - response.raid.hpRemaining;
          setRecentDamage(damageTaken);
          setDamageFlash(true);
          setTimeout(() => {
            setDamageFlash(false);
            setRecentDamage(null);
          }, 1000);
        }
        prevHpRef.current = response.raid.hpRemaining;
        setRaid(response.raid);
      } else {
        setRaid(null);
        prevHpRef.current = null;
      }
    } catch (error) {
      console.error('Error fetching raid status:', error);
      if (!silent) showMessage('Failed to fetch raid status', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Fetch available bosses
  const fetchBosses = useCallback(async () => {
    if (!party) return;
    
    try {
      const response = await apiGet(`/api/raids/bosses?members=${party.memberCount}`);
      setBosses(response);
    } catch (error) {
      console.error('Error fetching bosses:', error);
    }
  }, [party]);

  // Initial fetch
  useEffect(() => {
    fetchRaidStatus();
  }, [fetchRaidStatus]);

  // Fetch bosses when party is available
  useEffect(() => {
    if (party && !raid) {
      fetchBosses();
    }
  }, [party, raid, fetchBosses]);

  // Setup polling for real-time updates during active raid
  useEffect(() => {
    if (raid && raid.status === 'active') {
      pollingIntervalRef.current = setInterval(() => {
        fetchRaidStatus(true);
      }, POLL_INTERVAL);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [raid, fetchRaidStatus]);

  // Start raid handler
  const handleStartRaid = async () => {
    if (!selectedBoss) {
      showMessage('Please select a boss', 'error');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await apiPost('/api/raids/start', { bossId: selectedBoss.id });
      showMessage(`Raid started! Fight ${response.raid.bossName}!`, 'success');
      setRaid(response.raid);
      prevHpRef.current = response.raid.hpRemaining;
      setSelectedBoss(null);
    } catch (error: any) {
      showMessage(error.message || 'Failed to start raid', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Log workout damage handler
  const handleLogDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!raid) return;
    
    try {
      setActionLoading(true);
      const response = await apiPost(`/api/raids/${raid.id}/workout-damage`, workoutForm);
      
      showMessage(`${response.damageDealt} damage! (${workoutForm.exercise} x${workoutForm.reps})`, 'success');
      
      // Update local state immediately for responsiveness
      setRaid(response.raid);
      prevHpRef.current = response.raid.hpRemaining;
      
      if (response.isDefeated) {
        showMessage('BOSS DEFEATED! Victory!', 'success');
      }
    } catch (error: any) {
      showMessage(error.message || 'Failed to log damage', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Abandon raid handler
  const handleAbandonRaid = async () => {
    if (!raid) return;
    if (!window.confirm('Are you sure you want to abandon this raid? All progress will be lost.')) return;
    
    try {
      setActionLoading(true);
      await apiPost(`/api/raids/${raid.id}/abandon`);
      showMessage('Raid abandoned', 'success');
      setRaid(null);
      prevHpRef.current = null;
      fetchBosses();
    } catch (error: any) {
      showMessage(error.message || 'Failed to abandon raid', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'normal': return '#10B981';
      case 'hard': return '#F59E0B';
      case 'legendary': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  // Format HP numbers
  const formatHp = (hp: number) => {
    if (hp >= 1000) {
      return `${(hp / 1000).toFixed(1)}K`;
    }
    return hp.toString();
  };

  // Render no party state
  const renderNoParty = () => (
    <div className="raid-screen no-party">
      <div className="raid-hero">
        <div className="raid-hero-icon">RAID</div>
        <h2>Join a Party to Raid</h2>
        <p>You need to be in a party to challenge raid bosses. Create or join a party first!</p>
      </div>
    </div>
  );

  // Render boss selection
  const renderBossSelection = () => (
    <div className="raid-screen boss-selection">
      <div className="boss-header">
        <h2>Choose Your Challenge</h2>
        <p className="boss-subtitle">
          Select a boss to battle with your party ({party?.memberCount} members)
        </p>
      </div>

      <div className="boss-grid">
        {bosses.map(boss => (
          <div
            key={boss.id}
            className={`boss-card ${selectedBoss?.id === boss.id ? 'selected' : ''} ${!boss.isAvailable ? 'unavailable' : ''}`}
            style={{ '--boss-color': boss.color } as React.CSSProperties}
            onClick={() => boss.isAvailable && setSelectedBoss(boss)}
          >
            <div className="boss-banner" style={{ backgroundColor: boss.color }}>
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(boss.difficulty) }}
              >
                {boss.difficulty}
              </span>
              <div className="boss-icon">
                {boss.difficulty === 'legendary' ? 'L' : boss.difficulty === 'hard' ? 'H' : 'N'}
              </div>
            </div>
            
            <div className="boss-content">
              <h3>{boss.name}</h3>
              <p className="boss-flavor">{boss.flavorText}</p>
              
              <div className="boss-stats">
                <div className="stat">
                  <span className="stat-label">Scaled HP</span>
                  <span className="stat-value">{formatHp(boss.scaledHp)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">XP Reward</span>
                  <span className="stat-value">{boss.rewards.xpPerMember}/member</span>
                </div>
              </div>
              
              {!boss.isAvailable && (
                <div className="boss-requirement">
                  Requires {boss.minMembers}-{boss.maxMembers} members
                </div>
              )}
            </div>
            
            {selectedBoss?.id === boss.id && (
              <div className="selected-indicator">Selected</div>
            )}
          </div>
        ))}
      </div>

      {selectedBoss && party?.ownerId === userProfile?.uid && (
        <div className="start-raid-section">
          <div className="selected-boss-preview">
            <h3>Ready to fight {selectedBoss.name}?</h3>
            <p>HP: {formatHp(selectedBoss.scaledHp)} | Difficulty: {selectedBoss.difficulty}</p>
          </div>
          <button 
            className="start-raid-btn"
            onClick={handleStartRaid}
            disabled={actionLoading}
          >
            {actionLoading ? 'Starting...' : 'Start Raid'}
          </button>
        </div>
      )}

      {selectedBoss && party?.ownerId !== userProfile?.uid && (
        <div className="waiting-section">
          <p>Waiting for party owner to start the raid...</p>
        </div>
      )}
    </div>
  );

  // Render active raid battle
  const renderActiveBattle = () => {
    if (!raid) return null;
    
    const hpPercentage = (raid.hpRemaining / raid.hpTotal) * 100;
    const isOwner = party?.ownerId === userProfile?.uid;
    const leaderboard = raid.leaderboard || [];
    
    return (
      <div className="raid-screen active-battle">
        {/* Boss Section */}
        <div 
          className={`boss-battle-header ${damageFlash ? 'damage-flash' : ''}`}
          style={{ '--boss-color': raid.bossColor } as React.CSSProperties}
        >
          <div className="boss-info">
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(raid.bossDifficulty) }}
            >
              {raid.bossDifficulty}
            </span>
            <h2>{raid.bossName}</h2>
            <p className="boss-flavor-battle">{raid.bossFlavorText}</p>
          </div>
          
          {/* HP Bar */}
          <div className="hp-section">
            <div className="hp-bar-container">
              <div 
                className="hp-bar-fill"
                style={{ 
                  width: `${hpPercentage}%`,
                  backgroundColor: hpPercentage > 50 ? '#10B981' : hpPercentage > 25 ? '#F59E0B' : '#EF4444'
                }}
              />
              <div className="hp-bar-glow" style={{ width: `${hpPercentage}%` }} />
            </div>
            <div className="hp-text">
              <span className="hp-current">{formatHp(raid.hpRemaining)}</span>
              <span className="hp-divider">/</span>
              <span className="hp-total">{formatHp(raid.hpTotal)}</span>
              <span className="hp-label">HP</span>
            </div>
            {recentDamage && (
              <div className="damage-popup">-{recentDamage}</div>
            )}
          </div>
          
          <div className="live-indicator">
            <span className="live-dot"></span>
            Live Battle
          </div>
        </div>

        {/* Battle Actions */}
        <div className="battle-actions">
          <h3>Deal Damage</h3>
          <form onSubmit={handleLogDamage} className="workout-damage-form">
            <div className="form-row">
              <select 
                value={workoutForm.exercise}
                onChange={e => setWorkoutForm({ ...workoutForm, exercise: e.target.value })}
              >
                <option value="squat">Squats</option>
                <option value="pushup">Push-ups</option>
                <option value="pullup">Pull-ups</option>
                <option value="burpee">Burpees</option>
                <option value="lunge">Lunges</option>
                <option value="plank">Plank (seconds)</option>
                <option value="run">Run (minutes)</option>
              </select>
              <input
                type="number"
                value={workoutForm.reps}
                onChange={e => setWorkoutForm({ ...workoutForm, reps: parseInt(e.target.value) || 0 })}
                min={1}
                max={1000}
                placeholder="Reps"
              />
              <button type="submit" disabled={actionLoading || workoutForm.reps <= 0}>
                {actionLoading ? '...' : 'Attack!'}
              </button>
            </div>
          </form>
        </div>

        {/* Contribution Leaderboard */}
        <div className="leaderboard-section">
          <h3>Contribution Leaderboard</h3>
          <div className="leaderboard-list">
            {leaderboard.map((entry: any, index: number) => (
              <div 
                key={entry.userId}
                className={`leaderboard-entry ${index === 0 ? 'top-contributor' : ''} ${entry.userId === userProfile?.uid ? 'is-you' : ''}`}
              >
                <span className="rank">#{entry.rank}</span>
                <div className="contributor-info">
                  <div className="contributor-avatar">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.username} />
                    ) : (
                      <span>{entry.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="contributor-name">{entry.username}</span>
                </div>
                <div className="contribution-stats">
                  <span className="damage-amount">{formatHp(entry.totalDamage)} dmg</span>
                  <span className="damage-percent">{entry.damagePercentage}%</span>
                </div>
                <div className="contribution-bar">
                  <div 
                    className="contribution-fill"
                    style={{ width: `${entry.damagePercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Damage Log */}
        {raid.damageLog && raid.damageLog.length > 0 && (
          <div className="damage-log-section">
            <h4>Recent Attacks</h4>
            <div className="damage-log">
              {raid.damageLog.slice(-5).reverse().map((entry, index) => (
                <div key={index} className="log-entry">
                  <span className="log-user">{entry.username}</span>
                  <span className="log-action">{entry.source}</span>
                  <span className="log-damage">-{entry.damage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abandon Button (Owner only) */}
        {isOwner && (
          <button 
            className="abandon-raid-btn"
            onClick={handleAbandonRaid}
            disabled={actionLoading}
          >
            Abandon Raid
          </button>
        )}
      </div>
    );
  };

  // Render victory screen
  const renderVictory = () => {
    if (!raid || raid.status !== 'completed') return null;
    
    const leaderboard = raid.leaderboard || [];
    const topContributor = leaderboard[0];
    
    return (
      <div className="raid-screen victory">
        <div className="victory-banner">
          <div className="victory-icon">VICTORY</div>
          <h2>Victory!</h2>
          <p>{raid.bossName} has been defeated!</p>
        </div>

        <div className="victory-stats">
          <div className="stat-card">
            <span className="stat-icon">DMG</span>
            <span className="stat-value">{formatHp(raid.hpTotal)}</span>
            <span className="stat-label">Total Damage</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">PTY</span>
            <span className="stat-value">{raid.memberCount}</span>
            <span className="stat-label">Party Members</span>
          </div>
        </div>

        {topContributor && (
          <div className="top-contributor-section">
            <h3>Top Contributor</h3>
            <div className="top-contributor-card">
              <div className="contributor-avatar large">
                {topContributor.avatarUrl ? (
                  <img src={topContributor.avatarUrl} alt={topContributor.username} />
                ) : (
                  <span>{topContributor.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="contributor-name">{topContributor.username}</span>
              <span className="contributor-damage">{formatHp(topContributor.totalDamage)} damage</span>
            </div>
          </div>
        )}

        <button 
          className="new-raid-btn"
          onClick={() => {
            setRaid(null);
            prevHpRef.current = null;
            fetchBosses();
          }}
        >
          Start New Raid
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="raid-screen loading">
        <div className="loading-spinner"></div>
        <p>Loading raid...</p>
      </div>
    );
  }

  return (
    <div className="raid-container">
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {!party && renderNoParty()}
      {party && !raid && renderBossSelection()}
      {party && raid && raid.status === 'active' && renderActiveBattle()}
      {party && raid && raid.status === 'completed' && raid.victory && renderVictory()}
    </div>
  );
};

export default RaidScreen;

