import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserProfile from './components/UserProfile';
import ProfileScreen from './components/ProfileScreen';
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

interface Equipment {
  id: string;
  name: string;
  type: string;
  stats: { [key: string]: number };
  rarity: string;
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

interface Gym {
  id: number;
  name: string;
  members: number;
  location: string;
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

const API_BASE = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : (process.env.NODE_ENV === 'production' 
      ? '/api'  // Use same domain in production (Heroku)
      : 'http://localhost:5000/api');  // Use local server in development

// Main App Component (without auth wrapper)
function MainApp() {
  const { userProfile, updateUserProfile } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [raidBoss, setRaidBoss] = useState<RaidBoss | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
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
        gym: userProfile.gym,
        workoutStreak: userProfile.workoutStreak,
        avatar: {
          level: userProfile.level,
          xp: userProfile.xp,
          strength: userProfile.strength,
          endurance: userProfile.endurance,
          agility: userProfile.agility,
          equipment: Object.values(userProfile.equipment)
        }
      };
      setUser(compatibleUser);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [questsRes, raidRes, leaderRes, achieveRes, inventoryRes, duelsRes, activityRes, gymsRes] = await Promise.all([
        fetch(`${API_BASE}/quests`),
        fetch(`${API_BASE}/raid`),
        fetch(`${API_BASE}/leaderboard`),
        fetch(`${API_BASE}/achievements`),
        fetch(`${API_BASE}/inventory`),
        fetch(`${API_BASE}/duels`),
        fetch(`${API_BASE}/activity`),
        fetch(`${API_BASE}/gyms`)
      ]);
      
      setQuests(await questsRes.json());
      setRaidBoss(await raidRes.json());
      setLeaderboard(await leaderRes.json());
      setAchievements(await achieveRes.json());
      setInventory(await inventoryRes.json());
      setDuels(await duelsRes.json());
      setActivityFeed(await activityRes.json());
      setGyms(await gymsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage('Backend not running! Start server with: cd server && npm run dev');
    }
  };

  const logWorkout = async () => {
    try {
      const res = await fetch(`${API_BASE}/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutForm)
      });
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questId })
      });
      const data = await res.json();
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

  const equipItem = async (itemId: string) => {
    try {
      const res = await fetch(`${API_BASE}/equip/${itemId}`, {
        method: 'POST'
      });
      const data = await res.json();
      setMessage(data.message);
      fetchData();
    } catch (error) {
      setMessage('Failed to equip item');
    }
  };

  const createDuel = async () => {
    try {
      const res = await fetch(`${API_BASE}/duels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duelForm)
      });
      const data = await res.json();
      setMessage(data.message);
      setDuelForm({ opponent: '', challenge: 'Most squats in 24h' });
      fetchData();
    } catch (error) {
      setMessage('Failed to create duel');
    }
  };

  const joinGym = async (gymId: number) => {
    try {
      const res = await fetch(`${API_BASE}/gyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gymId })
      });
      const data = await res.json();
      setMessage(data.message);
      fetchData();
    } catch (error) {
      setMessage('Failed to join gym');
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
        {['dashboard', 'profile', 'inventory', 'achievements', 'duels', 'gyms', 'social'].map(tab => (
          <button 
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

        {activeTab === 'inventory' && (
          <>
            <div className="card inventory-card">
              <h2>Inventory & Equipment</h2>
              <div className="inventory-grid">
                {inventory.map(item => (
                  <div key={item.id} className={`inventory-item ${item.rarity}`}>
                    <h4>{item.name}</h4>
                    <p className="item-type">{item.type}</p>
                    <div className="item-stats">
                      {Object.entries(item.stats).map(([stat, value]) => (
                        <span key={stat} className="stat">+{value} {stat}</span>
                      ))}
                    </div>
                    <button onClick={() => equipItem(item.id)} className="equip-btn">
                      Equip
                    </button>
                  </div>
                ))}
              </div>
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

        {activeTab === 'gyms' && (
          <>
            <div className="card gyms-card">
              <h2>Gym Selection</h2>
              <p>Current Gym: <strong>{user.gym}</strong></p>
              <div className="gyms-list">
                {gyms.map(gym => (
                  <div key={gym.id} className="gym-item">
                    <h4>{gym.name}</h4>
                    <p>{gym.location} • {gym.members} members</p>
                    <button onClick={() => joinGym(gym.id)}>
                      {user.gym === gym.name ? 'Current Gym' : 'Join Gym'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <ProfileScreen />
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
