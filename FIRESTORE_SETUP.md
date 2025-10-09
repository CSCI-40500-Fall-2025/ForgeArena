# Firestore Database Structure

This document outlines the Firestore database structure for the ForgeArena application.

## Collections

### users
Stores user profile data and avatar information.
```javascript
{
  id: string,                    // User ID (matches Auth UID)
  username: string,              // Display name
  gym: string,                   // Gym affiliation
  workoutStreak: number,         // Current workout streak
  lastWorkout: timestamp,        // Last workout date
  level: number,                 // Avatar level
  xp: number,                    // Experience points
  strength: number,              // Strength stat
  endurance: number,             // Endurance stat
  agility: number,               // Agility stat
  equipment: object,             // Equipped items
  inventory: array,              // Inventory items
  createdAt: timestamp           // Account creation date
}
```

### quests
Stores quest/challenge data.
```javascript
{
  id: number,                    // Quest ID
  title: string,                 // Quest title
  description: string,           // Quest description
  completed: boolean,            // Completion status
  progress: number,              // Progress percentage
  xpReward: number,              // XP reward for completion
  reward: string                 // Reward description
}
```

### raidBoss
Stores raid boss information.
```javascript
{
  name: string,                  // Boss name
  description: string,           // Boss description
  totalHP: number,               // Maximum HP
  currentHP: number,             // Current HP
  participants: number,          // Number of participants
  isActive: boolean,             // Whether raid is active
  startedAt: timestamp,          // Raid start time
  endedAt: timestamp             // Raid end time (if completed)
}
```

### workouts
Stores individual workout logs.
```javascript
{
  userId: string,                // User ID (Auth UID)
  exerciseType: string,          // Type of exercise
  reps: number,                  // Number of repetitions
  durationSeconds: number,       // Duration in seconds
  xpGained: number,              // XP earned from workout
  loggedAt: timestamp            // When workout was logged
}
```

### parties
Stores party/team information.
```javascript
{
  name: string,                  // Party name
  createdBy: string,             // Creator's user ID
  createdAt: timestamp           // Creation date
}
```

### partyMembers
Junction collection linking users to parties.
```javascript
{
  partyId: string,               // Reference to party document
  userId: string,                // User ID (Auth UID)
  joinedAt: timestamp            // When user joined party
}
```

### contributions
Logs damage/effort contributed to raids.
```javascript
{
  raidId: string,                // Reference to raid document
  userId: string,                // User ID (Auth UID)
  damageDealt: number,           // Damage contributed
  contributedAt: timestamp       // When contribution was made
}
```

### rewards
Stores rewards granted to users.
```javascript
{
  userId: string,                // User ID (Auth UID)
  description: string,           // Reward description
  isClaimed: boolean,            // Whether reward has been claimed
  grantedAt: timestamp           // When reward was granted
}
```

## Setup Instructions

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database

2. **Configure Authentication**
   - Enable Authentication in Firebase Console
   - Set up sign-in methods (Email/Password, Google, etc.)

3. **Set up Firestore**
   - Create collections as outlined above
   - Apply the security rules from `firestore.rules`

4. **Get Configuration**
   - Go to Project Settings → General
   - Add a web app if you haven't already
   - Copy the Firebase configuration object
   - Add the configuration to your environment variables

5. **Environment Variables**
   - Copy `firebase.env.example` to `client/.env`
   - Fill in your actual Firebase configuration values
