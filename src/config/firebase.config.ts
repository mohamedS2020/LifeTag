// Firebase Configuration
// This file contains the Firebase configuration for the LifeTag app
// Optimized for Expo + Firebase JS SDK v9 with proper AsyncStorage persistence

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth
} from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration with fallback values for production builds
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Singleton instances - definite assignment assertion since initializeFirebase will assign them
let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;

/**
 * Initialize Firebase with proper error handling and persistence
 */
const initializeFirebase = (): void => {
  try {
    if (getApps().length === 0) {
      console.log('🔥 Initializing Firebase');
      
      // Initialize Firebase App
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized');
      
      // Initialize Auth with AsyncStorage persistence for React Native
      // Using getReactNativePersistence from Firebase SDK v9
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
      
      // Initialize Firestore
      db = getFirestore(app);
      console.log('✅ Firestore initialized successfully');
      
      console.log('✅ Firebase fully initialized');
    } else {
      // Firebase already initialized, reuse existing instances
      app = getApps()[0];
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('✅ Reusing existing Firebase instance');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Re-throw to prevent app from running with broken Firebase
    throw new Error(
      `Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Initialize Firebase
initializeFirebase();

// Validate Firebase is properly initialized
if (!app || !auth || !db) {
  throw new Error('Firebase services not properly initialized - check console for errors');
}

// Export Firebase instances (non-null asserted since we validated above)
export { auth as auth, db as db };
export default app as FirebaseApp;

// Export initialization function for testing or re-initialization if needed
export { initializeFirebase };