import React, { useState, useEffect } from 'react';
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
  avatar: Avatar;
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

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [raidBoss, setRaidBoss] = useState<RaidBoss | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [workoutForm, setWorkoutForm] = useState({ exercise: 'squat', reps: 10 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, questsRes, raidRes, leaderRes] = await Promise.all([
        fetch(`${API_BASE}/user`),
        fetch(`${API_BASE}/quests`),
        fetch(`${API_BASE}/raid`),
        fetch(`${API_BASE}/leaderboard`)
      ]);
      
      setUser(await userRes.json());
      setQuests(await questsRes.json());
      setRaidBoss(await raidRes.json());
      setLeaderboard(await leaderRes.json());
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
      fetchData(); // Refresh data
    } catch (error) {
      setMessage('Failed to log workout');
    }
  };

  const completeQuest = async (questId: number) => {
    try {
      const res = await fetch(`${API_BASE}/quest/${questId}/complete`, {
        method: 'POST'
      });
      const data = await res.json();
      setMessage(`${data.message} +${data.xpGained} XP!`);
      fetchData();
    } catch (error) {
      setMessage('Failed to complete quest');
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
        <h1>ForgeArena</h1>
        <p>Gamified Fitness Platform - Proof of Concept</p>
      </header>

      <div className="dashboard">
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
          {message && <div className="message">{message}</div>}
        </div>

        {/* Quests */}
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
      </div>
    </div>
  );
}

export default App;
