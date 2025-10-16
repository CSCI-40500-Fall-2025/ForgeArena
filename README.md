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

- **User Authentication**: Email/password signup, login, logout with session persistence
- **Profile Management**: Unique handles, avatar uploads, profile customization
- **Avatar Progression**: Watch your avatar level up and gain stats as you log workouts
- **Workout Logging**: Simple interface to log different exercises and earn XP
- **Quest System**: Complete fitness challenges to earn rewards and XP
- **Raid Boss**: Community challenge where users collectively damage a boss
- **Leaderboard**: See how you rank against other players
- **Gamification**: XP, levels, stats, and visual progress bars
- **Protected Routes**: Authentication-based access control

Important Qualities for our software (layered software architecture project):
Our software focuses on building a strong fitness community and keeping members engaged through gamification and friendly competition. Users can earn XP by completing daily, weekly, and monthly quests, turning workouts into rewarding challenges. A leaderboard system tracks progress among individual members and gym clubs, encouraging consistent participation and healthy rivalry. All user data, progress, and quest history are securely stored in a database, ensuring that performance is tracked accurately and users can monitor their long-term achievements while staying motivated through community-driven competition.

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

6. **Set up Authentication** (Recommended)
   - Follow the guide in `AUTHENTICATION_SETUP.md`
   - Enable Email/Password authentication in Firebase Console
   - Users can now create accounts and have persistent data

7. **Set up Profile Management** (Optional)
   - Follow the guide in `PROFILE_SETUP.md`
   - Enable Firebase Storage for avatar uploads
   - Users can customize profiles with unique handles and avatars

### How to Use the Prototype

1. **Create Your Account**: Sign up with email and password to get started

2. **Customize Your Profile**: Go to the Profile tab to upload an avatar and set a unique handle

3. **View Your Avatar**: See your current level, XP, and stats (Strength, Endurance, Agility)

4. **Log Workouts**: 
   - Select an exercise type (Squats, Push-ups, Pull-ups, Running)
   - Enter the number of reps
   - Click "Log Workout" to earn XP and potentially level up

5. **Complete Quests**: Click "Complete Quest" on any active quest to earn bonus XP

6. **Attack Raid Boss**: Log squat exercises to damage the community raid boss "The Titan Squat"

7. **Check Leaderboard**: See how your level and XP compare to other players

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
- User profiles with avatar storage

**Storage (Firebase Storage)**
- Secure file uploads for user avatars
- Automatic image compression and optimization
- CDN-backed delivery for fast loading

### Future Features (Not in Prototype)

- Advanced avatar customization and equipment system
- Full Firebase Firestore integration for all game data
- Real-time multiplayer raid mechanics
- Gym-specific leaderboards and communities
- Push notifications for quest reminders (Firebase Cloud Messaging)
- Social features (friend system, sharing achievements)
- Mobile app version
- Party system with team challenges

### Notes

- This is a **proof of concept** - some data may reset when the server restarts
- User accounts and profiles persist across sessions with Firebase
- Avatar uploads and handles are stored permanently
- Raid boss HP decreases only with squat exercises
- Quest completion is simulated (just click the button)
- Designed to demonstrate core gamification concepts and modern web app features

---

*Built for CS 40500 - Software Engineering*
