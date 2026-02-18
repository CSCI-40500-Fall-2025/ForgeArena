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
    duels: 'Social & Duels Hub',
    raid: 'Raids',
    clubs: 'Territories',
    party: 'Party',
    avatar: 'Avatar & Inventory',
    profile: 'Profile',
    achievements: 'Achievements',
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
            <div className="ds-social-duels-grid">
              <div className="ds-social-duels-left">
                <section className="ds-hero-cta ds-hero-cta-duels">
                  <div className="ds-hero-cta-content">
                    <h3>Challenge Someone New</h3>
                    <p>Push your limits by starting a 1v1 challenge. Track steps, calories, or specific workout goals in real-time.</p>
                    <div className="ds-hero-cta-actions">
                      <button type="button" className="ds-btn-white" onClick={createDuel}>
                        <span className="material-symbols-outlined">add</span>
                        Create Duel
                      </button>
                      <button type="button" className="ds-btn-hero-secondary">Quick Invite</button>
                    </div>
                  </div>
                </section>
                <section className="ds-duel-form-card">
                  <h4 className="ds-duel-form-title">Create new duel</h4>
                  <div className="duel-form ds-duel-form-inline">
                    <input
                      type="text"
                      placeholder="Opponent username"
                      value={duelForm.opponent}
                      onChange={(e) => setDuelForm({ ...duelForm, opponent: e.target.value })}
                    />
                    <select
                      value={duelForm.challenge}
                      onChange={(e) => setDuelForm({ ...duelForm, challenge: e.target.value })}
                    >
                      <option value="Most squats in 24h">Most squats in 24h</option>
                      <option value="Most push-ups in 1h">Most push-ups in 1h</option>
                      <option value="Longest run this week">Longest run this week</option>
                      <option value="10k Step Challenge">10k Step Challenge</option>
                      <option value="Burn 500 Active Cal">Burn 500 Active Cal</option>
                    </select>
                    <button type="button" className="ds-btn-primary-sm" onClick={createDuel}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                      Create
                    </button>
                  </div>
                </section>
                <section className="ds-duels-section">
                  <div className="ds-duels-section-header">
                    <h2 className="ds-duels-section-title">Active Duels</h2>
                    <button type="button" className="ds-link-sm">View All</button>
                  </div>
                  <div className="ds-duel-cards">
                    {duels.length === 0 ? (
                      <p className="ds-empty-state">No active duels. Create one above.</p>
                    ) : (
                      duels.map(duel => {
                        const target = 10000;
                        const myVal = 6000 + duel.id * 1200 + (duel.id % 5) * 100;
                        const oppVal = 5500 + duel.id * 1100 + (duel.id % 7) * 80;
                        const myPct = Math.min(100, Math.round((myVal / target) * 100));
                        const oppPct = Math.min(100, Math.round((oppVal / target) * 100));
                        const remaining = duel.id % 2 === 0 ? '2h Remaining' : '8h Remaining';
                        const badgeClass = duel.id % 2 === 0 ? 'ds-badge-amber' : 'ds-badge-green';
                        const oppLeading = oppPct > myPct;
                        return (
                          <div key={duel.id} className="ds-duel-card">
                            <div className="ds-duel-card-header">
                              <div className="ds-duel-card-avatars">
                                <div className="ds-duel-avatar ds-duel-avatar-you" />
                                <div className="ds-duel-avatar ds-duel-avatar-opp" />
                              </div>
                              <div className="ds-duel-card-info">
                                <h4>{duel.challenge}</h4>
                                <p>vs. {duel.opponent}</p>
                              </div>
                              <span className={`ds-duel-badge ${badgeClass}`}>{remaining}</span>
                            </div>
                            <div className="ds-duel-card-body">
                              <div className="ds-duel-stats">
                                <span className="ds-duel-stat-you">You: {myVal.toLocaleString()}</span>
                                <span className="ds-duel-stat-target">Target: {target.toLocaleString()}</span>
                                <span className="ds-duel-stat-opp">{duel.opponent}: {oppVal.toLocaleString()}</span>
                              </div>
                              <div className="ds-duel-progress-bar">
                                <div className="ds-duel-progress-opp" style={{ width: `${oppPct}%` }} />
                                <div className="ds-duel-progress-you" style={{ width: `${myPct}%` }} />
                              </div>
                              {oppLeading && (
                                <p className="ds-duel-hint">{duel.opponent} is leading! Pick up the pace.</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
                {quests.length > 0 && (
                  <section className="ds-card ds-quests-card">
                    <h3 className="ds-card-title">Active Quests</h3>
                    <div className="ds-quest-list">
                      {quests.map(quest => (
                        <div key={quest.id} className={`ds-quest-item ${quest.completed ? 'completed' : ''}`}>
                          <h4>{quest.title}</h4>
                          <p>{quest.description}</p>
                          {quest.progress && <span className="ds-quest-progress">{quest.progress}</span>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <div className="ds-social-duels-right">
                <section className="ds-activity-feed">
                  <div className="ds-activity-feed-header">
                    <h2 className="ds-activity-feed-title">Activity Feed</h2>
                    <p className="ds-activity-feed-subtitle">Updates from your gym community</p>
                  </div>
                  <div className="ds-activity-feed-body">
                    {activityFeed.length === 0 ? (
                      <p className="ds-empty-state">No activity yet.</p>
                    ) : (
                      activityFeed.map((activity, idx) => (
                        <div key={activity.id} className="ds-activity-item">
                          <div className="ds-activity-avatar" />
                          <div className="ds-activity-body">
                            <p className="ds-activity-text">
                              <strong>{activity.user}</strong> {activity.action}
                            </p>
                            <p className="ds-activity-time">
                              {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ago
                            </p>
                            <div className="ds-activity-actions">
                              <button type="button" className="ds-activity-btn">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>thumb_up</span> 0
                              </button>
                              <button type="button" className="ds-activity-btn">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>comment</span> 0
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="ds-activity-feed-footer">
                    <button type="button" className="ds-load-more">Load More</button>
                  </div>
                </section>
              </div>
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
