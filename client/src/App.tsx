import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import ProfileScreen from './components/ProfileScreen';
import AICoach from './components/AICoach';
import AvatarEditor from './components/AvatarEditor';
import ClubsScreen from './components/ClubsScreen';
import PartyScreen from './components/PartyScreen';
import RaidScreen from './components/RaidScreen';
import { apiGet, apiPost } from './utils/api';
import './App.css';

interface Avatar {
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  agility: number;
  equipment: string[];
}

interface User {
  id: number;
  username: string;
  gym: string;
  workoutStreak: number;
  avatar: Avatar;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

interface Duel {
  id: number;
  challenger: string;
  opponent: string;
  status: string;
  challenge: string;
  deadline: Date;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  timestamp: Date;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  xpReward: number;
  progress?: string;
}

interface RaidBoss {
  name: string;
  description: string;
  totalHP: number;
  currentHP: number;
  participants: number;
}

// Main App Component (without auth wrapper)
function MainApp() {
  const { userProfile, updateUserProfile } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [raidBoss, setRaidBoss] = useState<RaidBoss | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [workoutForm, setWorkoutForm] = useState({ exercise: 'squat', reps: 10 });
  const [duelForm, setDuelForm] = useState({ opponent: '', challenge: 'Most squats in 24h' });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Convert userProfile to User format for compatibility
  useEffect(() => {
    if (userProfile) {
      const compatibleUser: User = {
        id: 1, // Keep for compatibility
        username: userProfile.username,
        gym: userProfile.gym || '',
        workoutStreak: userProfile.workoutStreak || 0,
        avatar: {
          level: userProfile.level || 1,
          xp: userProfile.xp || 0,
          strength: userProfile.strength || 10,
          endurance: userProfile.endurance || 10,
          agility: userProfile.agility || 10,
          equipment: userProfile.equipment ? Object.values(userProfile.equipment) : []
        }
      };
      setUser(compatibleUser);
    }
  }, [userProfile]);

  const fetchData = useCallback(async () => {
    try {
      const [questsData, raidData, leaderData, achieveData, duelsData, activityData] = await Promise.all([
        apiGet('/api/quests').catch(() => ({ all: [] })),
        apiGet('/api/raid').catch(() => null),
        apiGet('/api/leaderboard').catch(() => ({ leaderboard: [] })),
        apiGet('/api/achievements').catch(() => ({ achievements: [] })),
        apiGet('/api/duels').catch(() => ({ active: [], pending: [] })),
        apiGet('/api/activity').catch(() => [])
      ]);
      
      // Handle the new response formats
      setQuests(questsData.all || questsData || []);
      setRaidBoss(raidData);
      setLeaderboard(leaderData.leaderboard || leaderData || []);
      setAchievements(achieveData.achievements || achieveData || []);
      setDuels([...(duelsData.active || []), ...(duelsData.pending || [])]);
      setActivityFeed(activityData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage('Failed to load data. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile, fetchData]);

  const logWorkout = async () => {
    try {
      const data = await apiPost('/api/workout', workoutForm);
      setMessage(`${data.message} +${data.xpGained} XP!`);
      
      // Update user profile in Firebase if available
      if (userProfile && updateUserProfile) {
        const newXP = userProfile.xp + data.xpGained;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        await updateUserProfile({
          xp: newXP,
          level: newLevel,
          lastWorkout: new Date().toISOString(),
          workoutStreak: userProfile.workoutStreak + 1
        });
      }
      
      fetchData(); // Refresh other data
    } catch (error) {
      setMessage('Failed to log workout');
    }
  };

  const completeQuest = async (questId: number) => {
    try {
      const data = await apiPost(`/api/quests/${questId}/claim`, {});
      setMessage(`${data.message} +${data.xpGained} XP!`);
      
      // Update user profile in Firebase if available
      if (userProfile && updateUserProfile) {
        const newXP = userProfile.xp + data.xpGained;
        const newLevel = Math.floor(newXP / 100) + 1;
        
        await updateUserProfile({
          xp: newXP,
          level: newLevel
        });
      }
      
      fetchData();
    } catch (error) {
      setMessage('Failed to complete quest');
    }
  };

  const createDuel = async () => {
    try {
      const data = await apiPost('/api/duels', duelForm);
      setMessage(data.message);
      setDuelForm({ opponent: '', challenge: 'squats_24h' });
      fetchData();
    } catch (error) {
      setMessage('Failed to create duel');
    }
  };

  if (!user) {
    return (
      <div className="App">
        <h1>ForgeArena</h1>
        <p>Loading... {message && <span style={{color: 'red'}}>{message}</span>}</p>
      </div>
    );
  }

  const xpToNextLevel = user.avatar.level * 100 - user.avatar.xp;
  const xpProgress = (user.avatar.xp / (user.avatar.level * 100)) * 100;

  const headerTitles: Record<string, string> = {
    dashboard: `Welcome back, ${user.username}`,
    'ai-coach': 'AI Coach',
    duels: 'Duels Hub',
    raid: 'Raids',
    clubs: 'Territories',
    party: 'Party',
    avatar: 'Avatar & Inventory',
    profile: 'Profile',
    achievements: 'Achievements',
    social: 'Social',
    settings: 'Settings',
  };
  const headerTitle = headerTitles[activeTab] ?? 'ForgeArena';
  const showXP = activeTab === 'dashboard';

  return (
    <div className="App">
      <AppLayout
        activeTab={activeTab}
        onNavigate={setActiveTab}
        headerTitle={headerTitle}
        showXP={showXP}
        level={user.avatar.level}
        xpProgress={xpProgress}
        xpToNextLevel={xpToNextLevel}
      >
        {message && <div className="global-message">{message}</div>}

        <div className="dashboard">
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* BodyForge Avatar - design system */}
            <div className="ds-card">
              <div className="ds-card-header">
                <h3 className="ds-card-title">BodyForge Avatar</h3>
                <span className="ds-card-meta">Synced 2m ago</span>
              </div>
              <div className="ds-avatar-block">
                <div className="ds-avatar-figure">{user.username.charAt(0).toUpperCase()}</div>
                <div className="ds-avatar-stats">
                  {['Strength', 'Endurance', 'Agility'].map((label, i) => {
                    const val = [user.avatar.strength, user.avatar.endurance, user.avatar.agility][i];
                    const pct = Math.min(100, Math.round((val / 100) * 100));
                    return (
                      <div key={label}>
                        <div className="ds-stat-row">
                          <span>{label}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="ds-stat-bar-wrap">
                          <div className="ds-stat-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="ds-tip">Focus on Agility quests to unlock the Windrunner perk.</p>
                </div>
              </div>
            </div>

            {/* Quick-Log Workout - design system */}
            <div className="ds-card">
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-6)' }}>Quick-Log Workout</h3>
              <div className="ds-form-group">
                <label className="ds-form-label">Exercise</label>
                <select
                  className="ds-form-select"
                  value={workoutForm.exercise}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, exercise: e.target.value })}
                >
                  <option value="squat">Squats</option>
                  <option value="pushup">Push-ups</option>
                  <option value="pullup">Pull-ups</option>
                  <option value="run">Running</option>
                </select>
              </div>
              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Weight (kg)</label>
                  <input className="ds-form-input" type="number" placeholder="0" />
                </div>
                <div className="ds-form-group">
                  <label className="ds-form-label">Reps</label>
                  <input
                    className="ds-form-input"
                    type="number"
                    placeholder="0"
                    value={workoutForm.reps}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, reps: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <button type="button" className="ds-btn-primary-icon" onClick={logWorkout}>
                <span className="material-symbols-outlined">add_task</span>
                Log Session
              </button>
            </div>

            {/* Active Raid - design system */}
            {raidBoss ? (
              <div className="ds-card">
                <div className="ds-raid-header">
                  <div className="ds-raid-icon">
                    <span className="material-symbols-outlined">skull</span>
                  </div>
                  <div>
                    <h3 className="ds-raid-title">Active Raid: {raidBoss.name}</h3>
                    <p className="ds-raid-subtitle">Tier 3 Strength Boss</p>
                  </div>
                </div>
                <div className="ds-raid-hero">
                  <div className="ds-raid-hero-overlay">
                    <p>{raidBoss.description}</p>
                  </div>
                </div>
                <div className="ds-hp-row">
                  <span className="ds-hp-label">HP: {raidBoss.currentHP.toLocaleString()} / {raidBoss.totalHP.toLocaleString()}</span>
                  <span className="ds-hp-value">{Math.round((raidBoss.currentHP / raidBoss.totalHP) * 100)}% Health</span>
                </div>
                <div className="ds-hp-bar">
                  <div className="ds-hp-bar-fill" style={{ width: `${(raidBoss.currentHP / raidBoss.totalHP) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="ds-card">
                <div className="ds-raid-header">
                  <div className="ds-raid-icon">
                    <span className="material-symbols-outlined">skull</span>
                  </div>
                  <div>
                    <h3 className="ds-raid-title">No active raid</h3>
                    <p className="ds-raid-subtitle">Check back for the next boss</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Coach Recommendations - design system */}
            <div className="ds-card">
              <div className="ds-reco-header">
                <h3 className="ds-card-title">AI Coach Recommendations</h3>
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="ds-reco-list">
                <div className="ds-reco-item ds-reco-item-primary">
                  <div className="ds-reco-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>directions_run</span>
                  </div>
                  <div className="ds-reco-body">
                    <p>Recommended: 17 Squats for Agility</p>
                    <p className="ds-reco-desc">Based on your Agility gap, completing this set will grant +15 XP.</p>
                    <button type="button" className="ds-reco-link">Start Set <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span></button>
                  </div>
                </div>
                <div className="ds-reco-item">
                  <div className="ds-reco-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>restaurant</span>
                  </div>
                  <div className="ds-reco-body">
                    <p>Post-Workout Nutrition</p>
                    <p className="ds-reco-desc">Consume 25g of protein within 45 minutes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard - spans full width below grid */}
            <div className="ds-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Leaderboard</h3>
              {leaderboard.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No entries yet.</p>
              ) : (
                leaderboard.map((player, index) => (
                  <div key={index} className={`leaderboard-entry ${player.username === user.username ? 'you' : ''}`}>
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{player.username}</span>
                    <span className="level">Lv.{player.level}</span>
                    <span className="xp">{player.xp} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <>
            <div className="ds-page-header">
              <div>
                <h1 className="ds-page-title">Achievements</h1>
                <p className="ds-page-subtitle">Push your limits and unlock exclusive rewards.</p>
              </div>
            </div>
            <div className="ds-card">
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Achievements</h3>
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div key={achievement.id} className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <h4>{achievement.name}</h4>
                    <p>{achievement.description}</p>
                    {achievement.unlocked && <span className="unlocked-badge">Unlocked!</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'duels' && (
          <>
            <div className="ds-page-header">
              <div>
                <h1 className="ds-page-title">Social & Duels Hub</h1>
                <p className="ds-page-subtitle">Compete with friends and track community achievements.</p>
              </div>
              <div className="ds-stat-pills">
                <div className="ds-stat-pill">
                  <div className="ds-stat-pill-label">Rank</div>
                  <div className="ds-stat-pill-value">Gold III</div>
                </div>
                <div className="ds-stat-pill">
                  <div className="ds-stat-pill-label">Wins</div>
                  <div className="ds-stat-pill-value">{duels.filter((d: Duel) => d.status === 'won').length || '0'}</div>
                </div>
                <div className="ds-stat-pill">
                  <div className="ds-stat-pill-label">Friends</div>
                  <div className="ds-stat-pill-value">128</div>
                </div>
              </div>
            </div>
            <div className="ds-hero-cta">
              <h3>Challenge Someone New</h3>
              <p>Push your limits by starting a 1v1 challenge. Track steps, calories, or specific workout goals.</p>
              <div className="duel-form" style={{ marginBottom: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  placeholder="Opponent username"
                  value={duelForm.opponent}
                  onChange={(e) => setDuelForm({ ...duelForm, opponent: e.target.value })}
                  style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', minWidth: 160 }}
                />
                <select
                  value={duelForm.challenge}
                  onChange={(e) => setDuelForm({ ...duelForm, challenge: e.target.value })}
                  style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: 'none', minWidth: 180 }}
                >
                  <option value="Most squats in 24h">Most squats in 24h</option>
                  <option value="Most push-ups in 1h">Most push-ups in 1h</option>
                  <option value="Longest run this week">Longest run this week</option>
                </select>
                <button type="button" className="ds-btn-white" onClick={createDuel}>
                  <span className="material-symbols-outlined">add</span>
                  Create Duel
                </button>
              </div>
            </div>
            <div className="ds-card">
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Active Duels</h3>
              {duels.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No active duels. Create one above.</p>
              ) : (
                duels.map(duel => (
                  <div key={duel.id} className={`duel-item ${duel.status}`}>
                    <h4>{duel.challenger} vs {duel.opponent}</h4>
                    <p>{duel.challenge}</p>
                    <p className="duel-status">Status: {duel.status}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'clubs' && (
          <ClubsScreen />
        )}

        {activeTab === 'party' && (
          <PartyScreen />
        )}

        {activeTab === 'raid' && (
          <RaidScreen />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen />
        )}

        {activeTab === 'avatar' && (
          <AvatarEditor />
        )}

        {activeTab === 'ai-coach' && (
          <AICoach />
        )}

        {activeTab === 'social' && (
          <>
            <div className="ds-page-header">
              <div>
                <h1 className="ds-page-title">Social</h1>
                <p className="ds-page-subtitle">Quests and activity from the arena.</p>
              </div>
            </div>
            <div className="ds-card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Active Quests</h3>
              {quests.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No active quests.</p>
              ) : (
                quests.map(quest => (
                  <div key={quest.id} className={`quest ${quest.completed ? 'completed' : ''}`}>
                    <h3>{quest.title}</h3>
                    <p>{quest.description}</p>
                    {quest.progress && <p>Progress: {quest.progress}</p>}
                    <p>Reward: {quest.xpReward} XP</p>
                    {!quest.completed && (
                      <button onClick={() => completeQuest(quest.id)}>Complete Quest</button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="ds-card">
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Activity Feed</h3>
              {activityFeed.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No activity yet.</p>
              ) : (
                activityFeed.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <strong>{activity.user}</strong> {activity.action}
                    <span className="activity-time">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div className="ds-page-header">
              <div>
                <h1 className="ds-page-title">Settings</h1>
                <p className="ds-page-subtitle">Account and app preferences.</p>
              </div>
            </div>
            <div className="ds-card">
              <h3 className="ds-card-title" style={{ marginBottom: 'var(--space-4)' }}>Settings</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Account and app settings will appear here. Use Profile for now.</p>
            </div>
          </>
        )}
        </div>
      </AppLayout>
    </div>
  );
}

// App component with authentication
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
