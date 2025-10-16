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

**FOR:** Gym-goers and fitness enthusiasts struggling with motivation  
**WHO:** Want their progress to feel meaningful, social, and visually rewarding  

**FORGEARENA** is a **gamified fitness platform** that blends **avatar evolution** with **social competition** — allowing you to level up your personal avatar (*BodyForge*) while competing in gym-based challenges, quests, and leaderboards (*FitArena*).  

Unlike existing apps that focus on either solo avatar growth or passive global leaderboards, **our product** creates **immersive, local gym communities**. See your avatar evolve as you earn XP, complete quests, and rise on leaderboards among peers.

---

## ✨ Core Features

- **Avatar-Based Progression:** Your avatar grows, levels up, and earns gear.  
- **Avatar Customization:** Earn cosmetic gear or upgrades (armor, badges, etc.) that reflect real-world milestones.  
- **Duel Mode:** Friendly competitions to see who logs more reps, steps, or streaks in a set time.  
- **Gym Quests:** “Attend 3 group classes this week” or “Beat your leg press record.”  
- **Local Social Competition:** Weekly gym quests, buddy duels, and club leaderboards (with custom clubs per gym).  
- **Social & Personal Incentives:** Visual rewards and recognition amplify motivation.  
- **Social Feed & Support:** Share avatar changes, celebrate PRs, and cheer peers in-app.  
- **Seasonal Boss Challenges:** Conquer a “Giant Squat” boss by cumulative gym visits or lifting achievements.  
- **RPG Elements + Real Results:** Storytelling meets tangible fitness metrics for emotional engagement.

---

## 🧩 Raid Boss Mechanic for Fitness

**Core Idea:**  
Each raid boss represents a massive community fitness goal.

| Element | Description |
|----------|-------------|
| **Bosses = Fitness Goals** | e.g., *“The Titan Squat” = 10,000 squats collectively* |
| **Parties/Guilds = Workout Groups** | Join a raid with friends, gym peers, or random matchmaking |
| **Damage = Workout Output** | Every rep, mile, or minute logged = “damage” dealt to the boss |
| **Rewards = Avatar Progression** | Unlock cosmetic gear, stat boosts, or XP multipliers |

---

## 🏗️ Layered Software Architecture

ForgeArena focuses on building a strong **fitness community** through **gamification** and **friendly competition**.  
Users can earn XP by completing quests, tracked securely in a database with leaderboards and detailed user stats.

### **System Layers**

1. **Presentation Layer (UI)**  
   - React web client with interactive dashboards, leaderboards, and quest tracking  
2. **Application Layer (API & Request Handling)**  
   - RESTful Express.js endpoints for workouts, quests, raids, and leaderboards  
3. **Business Logic Layer**  
   - Gamification engine: XP, quests, avatar progression, and raid mechanics  
4. **Data Access Layer**  
   - Repository pattern managing Firestore collections for users, quests, raids, and gyms  
5. **Infrastructure Layer**  
   - Firebase authentication, storage, caching, and monitoring

---

## ⚙️ Technology Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | React, TypeScript, React Router, Axios, CSS Modules |
| **Backend** | Node.js, Express.js, Firebase Auth |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Cache** | Redis (for leaderboard/quest caching) |
| **Deployment** | Google Cloud Platform / Firebase Hosting |
| **Build Tools** | Vite, npm, PM2 |
| **Docs & API** | Swagger / OpenAPI 3.0 |

---

## 🧱 Architectural Qualities

| Quality | Priority | Rationale | Trade-off |
|----------|-----------|------------|------------|
| **Scalability & Performance** | Critical | Real-time leaderboards & social features | Increased system complexity |
| **Evolvability & Maintainability** | High | Frequent feature updates | Added modular overhead |
| **Security** | High | Protects fitness and personal data | Slightly slower development |

---

## 🧩 Core Components Overview

### **Presentation Layer (Client-Side)**
- **Authentication** – Login, registration, password recovery  
- **Dashboard** – Avatar display, progress, quick stats  
- **Workout Arena** – Log workouts, view history  
- **Quest Chamber** – View and complete quests  
- **Raid Portal** – Participate in community boss events  
- **Social Hub** – Leaderboards and activity feeds  
- **Profile Forge** – Avatar customization and achievements  

### **Application Layer (Server-Side)**
- **Controllers:**  
  `/api/auth`, `/api/users`, `/api/workouts`, `/api/quests`, `/api/raid`, `/api/leaderboard`  
- **Middleware:** Authentication, rate limiting, session management  

### **Business Logic Layer**
- **User Service** – Profile & avatar management  
- **Gamification Engine** – XP, level progression, stat mechanics  
- **Quest Service** – Quest validation, rewards, and cycling  
- **Raid Service** – Boss health, damage, and event scheduling  
- **Leaderboard Service** – Ranking logic & caching  

---

## ⚙️ System Architecture Diagram
![Architecture Diagram](./docs/architecture.png)

---

## 🧠 Key Architectural Decisions

1. **Architecture Type:** Modular Monolith  
   - Simpler for current scale; can evolve to microservices later.  
2. **Real-time Updates:** Polling first → WebSockets later  
   - Easier MVP rollout; scalable for live raid events.  
3. **Data Consistency:** Eventual Consistency  
   - Minor leaderboard delays tolerated for better performance.  

---

## 🚀 Future Plans

### **Scalability**
- Database sharding (user-based)
- Split microservices: Gamification / Social / Analytics  
- CDN expansion for global delivery  

### **Mobile Strategy**
1. Responsive web app (current)  
2. React Native app (shared logic)  
3. Native features: push notifications, HealthKit/Google Fit integration  

---

## 🗺️ Implementation Roadmap

**Phase 1: Core Architecture (Current)**  
- Layered backend, gamification engine, Firebase integration, React client  

**Phase 2: Scaling Preparation**  
- Add caching, rate limiting, and monitoring  

**Phase 3: Advanced Features**  
- Real-time events, mobile app, gym management tools  

---

### 🧰 Summary

ForgeArena transforms workouts into **quests**, progress into **XP**, and gym communities into **adventure parties**.  
It’s fitness reimagined as an **RPG with real-world rewards** — one rep, one quest, one victory at a time.


*Built for CS 40500 - Software Engineering*
