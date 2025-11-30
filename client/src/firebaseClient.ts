import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Re-export from firebaseConfig for backward compatibility
export { db, storage } from './firebaseConfig';

