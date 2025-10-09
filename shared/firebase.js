// Firebase integration with fallback to mock data
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, getDocs, where } from 'firebase/firestore';

let db = null;

const initFirebase = () => {
  if (!db && process.env.FIREBASE_PROJECT_ID) {
    try {
      const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      };
      
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.log('Firebase initialization failed:', error.message);
      db = null;
    }
  }
  return db;
};

// Get user data
const getUser = async () => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const userDoc = doc(firestore, 'users', 'TestWarrior');
      const docSnap = await getDoc(userDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: data.id,
          username: data.username,
          gym: data.gym,
          workoutStreak: data.workoutStreak,
          lastWorkout: data.lastWorkout,
          avatar: {
            level: data.level,
            xp: data.xp,
            strength: data.strength,
            endurance: data.endurance,
            agility: data.agility,
            equipment: data.equipment,
            inventory: data.inventory
          }
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  // Fallback to mock data
  const { mockUser } = require('./mockData');
  return mockUser;
};

// Update user data
const updateUser = async (userUpdates) => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const userDoc = doc(firestore, 'users', 'TestWarrior');
      await updateDoc(userDoc, {
        gym: userUpdates.gym,
        workoutStreak: userUpdates.workoutStreak,
        lastWorkout: userUpdates.lastWorkout,
        level: userUpdates.avatar?.level,
        xp: userUpdates.avatar?.xp,
        strength: userUpdates.avatar?.strength,
        endurance: userUpdates.avatar?.endurance,
        agility: userUpdates.avatar?.agility,
        equipment: userUpdates.avatar?.equipment,
        inventory: userUpdates.avatar?.inventory
      });
      
      console.log('User updated in database');
      return userUpdates;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockUser } = require('./mockData');
  Object.assign(mockUser, userUpdates);
  return mockUser;
};

// Get raid boss
const getRaidBoss = async () => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const raidDoc = doc(firestore, 'raidBoss', 'current');
      const docSnap = await getDoc(raidDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          name: data.name,
          description: data.description,
          totalHP: data.totalHP,
          currentHP: data.currentHP,
          participants: data.participants
        };
      } else {
        throw new Error('Raid boss not found');
      }
    } catch (error) {
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  const { mockRaidBoss } = require('./mockData');
  return mockRaidBoss;
};

// Update raid boss
const updateRaidBoss = async (updates) => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const raidDoc = doc(firestore, 'raidBoss', 'current');
      await updateDoc(raidDoc, {
        currentHP: updates.currentHP,
        participants: updates.participants
      });
      
      console.log('Raid boss updated in database');
      return updates;
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockRaidBoss } = require('./mockData');
  if (updates.currentHP !== undefined) mockRaidBoss.currentHP = updates.currentHP;
  if (updates.participants !== undefined) mockRaidBoss.participants = updates.participants;
  return mockRaidBoss;
};

// Get quests
const getQuests = async () => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const questsRef = collection(firestore, 'quests');
      const q = query(questsRef, orderBy('id'));
      const querySnapshot = await getDocs(q);
      
      const quests = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quests.push({
          id: data.id,
          title: data.title,
          description: data.description,
          completed: data.completed,
          progress: data.progress,
          xpReward: data.xpReward,
          reward: data.reward
        });
      });
      
      return quests;
    } catch (error) {
      console.log('Database error, using fallback:', error.message);
    }
  }
  
  const { mockQuests } = require('./mockData');
  return mockQuests;
};

// Update quest
const updateQuest = async (questId, updates) => {
  const firestore = initFirebase();
  if (firestore) {
    try {
      const questsRef = collection(firestore, 'quests');
      const q = query(questsRef, where('id', '==', questId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const questDoc = querySnapshot.docs[0];
        await updateDoc(questDoc.ref, updates);
        console.log('Quest updated in database');
        return { id: questId, ...updates };
      }
    } catch (error) {
      console.log('Database update error:', error.message);
    }
  }
  
  // Fallback: update mock data
  const { mockQuests } = require('./mockData');
  const quest = mockQuests.find(q => q.id == questId);
  if (quest) {
    Object.assign(quest, updates);
  }
  return quest;
};

module.exports = {
  getUser,
  updateUser,
  getRaidBoss,
  updateRaidBoss,
  getQuests,
  updateQuest
};
