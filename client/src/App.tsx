import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';
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

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>ForgeArena</h1>
            <p>Gamified Fitness Platform - Proof of Concept</p>
          </div>
          <UserProfile className="header-user" />
        </div>
      </header>

      <nav className="nav-tabs">
        {['dashboard', 'avatar', 'ai-coach', 'profile', 'achievements', 'duels', 'clubs', 'party', 'raid', 'social'].map(tab => (
          <button 
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ai-coach' ? 'AI Coach' : 
             tab === 'avatar' ? 'Avatar & Inventory' : 
             tab === 'clubs' ? 'Clubs' :
             tab === 'party' ? 'Party' :
             tab === 'raid' ? 'Raid' :
             tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {message && <div className="global-message">{message}</div>}

      <div className="dashboard">
        {activeTab === 'dashboard' && (
          <>
            {/* Avatar Section */}
            <div className="card avatar-card">
              <h2>{user.username}'s Avatar</h2>
              <div className="avatar-stats">
                <div className="level">Level {user.avatar.level}</div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{width: `${xpProgress}%`}}></div>
                  <span className="xp-text">{user.avatar.xp} XP ({xpToNextLevel} to next level)</span>
                </div>
                <div className="stats">
                  STR: {user.avatar.strength} | 
                  END: {user.avatar.endurance} | 
                  AGI: {user.avatar.agility}
                </div>
              </div>
            </div>

            {/* Workout Logger */}
            <div className="card workout-card">
              <h2>Log Workout</h2>
              <div className="workout-form">
                <select 
                  value={workoutForm.exercise} 
                  onChange={(e) => setWorkoutForm({...workoutForm, exercise: e.target.value})}
                >
                  <option value="squat">Squats</option>
                  <option value="pushup">Push-ups</option>
                  <option value="pullup">Pull-ups</option>
                  <option value="run">Running</option>
                </select>
                <input 
                  type="number" 
                  value={workoutForm.reps} 
                  onChange={(e) => setWorkoutForm({...workoutForm, reps: parseInt(e.target.value)})}
                  placeholder="Reps"
                />
                <button onClick={logWorkout}>Log Workout</button>
              </div>
            </div>

            {/* Raid Boss */}
            {raidBoss && (
              <div className="card raid-card">
                <h2>Raid Boss</h2>
                <h3>{raidBoss.name}</h3>
                <p>{raidBoss.description}</p>
                <div className="boss-hp">
                  <div className="hp-bar">
                    <div 
                      className="hp-fill" 
                      style={{width: `${(raidBoss.currentHP / raidBoss.totalHP) * 100}%`}}
                    ></div>
                  </div>
                  <p>{raidBoss.currentHP.toLocaleString()} / {raidBoss.totalHP.toLocaleString()} HP</p>
                  <p>{raidBoss.participants} warriors participating!</p>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div className="card leaderboard-card">
              <h2>Leaderboard</h2>
              {leaderboard.map((player, index) => (
                <div key={index} className={`leaderboard-entry ${player.username === user.username ? 'you' : ''}`}>
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{player.username}</span>
                  <span className="level">Lv.{player.level}</span>
                  <span className="xp">{player.xp} XP</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'achievements' && (
          <>
            <div className="card achievements-card">
              <h2>Achievements</h2>
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
            <div className="card duels-card">
              <h2>Duels & Challenges</h2>
              <div className="duel-form">
                <h3>Create New Duel</h3>
                <input 
                  type="text" 
                  placeholder="Opponent username"
                  value={duelForm.opponent}
                  onChange={(e) => setDuelForm({...duelForm, opponent: e.target.value})}
                />
                <select 
                  value={duelForm.challenge}
                  onChange={(e) => setDuelForm({...duelForm, challenge: e.target.value})}
                >
                  <option value="Most squats in 24h">Most squats in 24h</option>
                  <option value="Most push-ups in 1h">Most push-ups in 1h</option>
                  <option value="Longest run this week">Longest run this week</option>
                </select>
                <button onClick={createDuel}>Send Challenge</button>
              </div>
              
              <div className="active-duels">
                <h3>Active Duels</h3>
                {duels.map(duel => (
                  <div key={duel.id} className={`duel-item ${duel.status}`}>
                    <h4>{duel.challenger} vs {duel.opponent}</h4>
                    <p>{duel.challenge}</p>
                    <p className="duel-status">Status: {duel.status}</p>
                  </div>
                ))}
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

        {activeTab === 'social' && (
          <>
            <div className="card quests-card">
              <h2>Active Quests</h2>
              {quests.map(quest => (
                <div key={quest.id} className={`quest ${quest.completed ? 'completed' : ''}`}>
                  <h3>{quest.title}</h3>
                  <p>{quest.description}</p>
                  {quest.progress && <p>Progress: {quest.progress}</p>}
                  <p>Reward: {quest.xpReward} XP</p>
                  {!quest.completed && (
                    <button onClick={() => completeQuest(quest.id)}>Complete Quest</button>
                  )}
                </div>
              ))}
            </div>

            <div className="card activity-card">
              <h2>Activity Feed</h2>
              {activityFeed.map(activity => (
                <div key={activity.id} className="activity-item">
                  <strong>{activity.user}</strong> {activity.action}
                  <span className="activity-time">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
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
