# ForgeArena - Gamified Fitness Platform

**FOR:** Gym-goers and fitness enthusiasts struggling with motivation  
**WHO:** Want their progress to feel meaningful, social, and visually rewarding  
**FORGEARENA** is a gamified fitness platform that blends avatar evolution with social competition  
**THAT** allows you to level up your personal avatar (BodyForge) while competing in gym-based challenges, quests, and leaderboards (FitArena)  
**UNLIKE** existing apps that focus on either solo avatar growth or passive global leaderboards  
**OUR PRODUCT** creates immersive, local gym communities. See your avatar evolve as you earn XP, complete quests, and rise on leaderboards among peers

## Proof of Concept Prototype

This is a bare-bones prototype demonstrating the core ForgeArena concepts using the FERN stack (Firebase, Express, React, Node.js). The prototype uses mock data to showcase key features with optional Firebase integration for data persistence.

### Features Demonstrated

- **Avatar Progression**: Watch your avatar level up and gain stats as you log workouts
- **Workout Logging**: Simple interface to log different exercises and earn XP
- **Quest System**: Complete fitness challenges to earn rewards and XP
- **Raid Boss**: Community challenge where users collectively damage a boss
- **Leaderboard**: See how you rank against other players
- **Gamification**: XP, levels, stats, and visual progress bars

### Setup Instructions

#### Prerequisites
- Node.js (v14 or higher)
- npm

#### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd forge-arena
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - React frontend on `http://localhost:3000`

#### Manual Setup (if npm run dev doesn't work)

1. **Start the backend server**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **In a new terminal, start the frontend**
   ```bash
   cd client
   npm install
   npm start
   ```

#### Firebase Setup (Optional)

For persistent data storage, you can set up Firebase:

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Firestore Database** in your Firebase project

3. **Set up environment variables**
   ```bash
   cp firebase.env.example client/.env
   ```
   Fill in your Firebase configuration values in `client/.env`

4. **Apply Firestore security rules**
   - Copy the rules from `firestore.rules`
   - Paste them in Firebase Console → Firestore Database → Rules

5. **Initialize your database**
   - See `FIRESTORE_SETUP.md` for detailed database structure
   - The app will automatically fall back to mock data if Firebase is not configured

### How to Use the Prototype

1. **View Your Avatar**: See your current level, XP, and stats (Strength, Endurance, Agility)

2. **Log Workouts**: 
   - Select an exercise type (Squats, Push-ups, Pull-ups, Running)
   - Enter the number of reps
   - Click "Log Workout" to earn XP and potentially level up

3. **Complete Quests**: Click "Complete Quest" on any active quest to earn bonus XP

4. **Attack Raid Boss**: Log squat exercises to damage the community raid boss "The Titan Squat"

5. **Check Leaderboard**: See how your level and XP compare to other players

### Technical Architecture

**Backend (Express + Node.js)**
- Simple REST API with mock data fallback
- Optional Firebase Firestore integration for data persistence
- Endpoints for user data, workouts, quests, raids, and leaderboards

**Frontend (React + TypeScript)**
- Modern, responsive UI with gamified styling
- Real-time updates when logging workouts or completing quests
- Visual progress bars and level-up animations

**Database (Firebase Firestore)**
- NoSQL document database for flexible data storage
- Real-time synchronization capabilities
- Scalable cloud infrastructure

### Future Features (Not in Prototype)

- User authentication and registration (Firebase Auth)
- Full Firebase Firestore integration
- Real-time multiplayer raid mechanics
- Gym-specific leaderboards and communities
- Avatar customization and equipment system
- Push notifications for quest reminders (Firebase Cloud Messaging)
- Social features (friend system, sharing achievements)
- Mobile app version

### Notes

- This is a **proof of concept** - data resets when the server restarts
- No real user accounts - everyone shares the same "TestWarrior" avatar
- Raid boss HP decreases only with squat exercises
- Quest completion is simulated (just click the button)
- Designed to demonstrate core gamification concepts, not production features

---

*Built for CS 40500 - Software Engineering*
