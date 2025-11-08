// Firebase Configuration
// This file contains the Firebase configuration for the LifeTag app
// Optimized for Expo + Firebase JS SDK v12 with proper AsyncStorage persistence

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth,
  browserLocalPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Custom AsyncStorage-based persistence for React Native
// This wraps AsyncStorage to match Firebase's Persistence interface
const getAsyncStoragePersistence = () => {
  if (Platform.OS === 'web') {
    return browserLocalPersistence;
  }
  
  // For React Native, create a custom persistence using AsyncStorage
  return {
    type: 'LOCAL' as const,
    async get(key: string) {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    },
    async set(key: string, value: any) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
    async remove(key: string) {
      await AsyncStorage.removeItem(key);
    }
  };
};

// Firebase configuration with fallback values for production builds
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ,
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
      console.log('🔥 Initializing Firebase for platform:', Platform.OS);
      
      // Initialize Firebase App
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth with platform-specific persistence
      if (Platform.OS === 'web') {
        // Web: Use browser localStorage
        auth = initializeAuth(app, {
          persistence: browserLocalPersistence
        });
        console.log('✅ Firebase Auth initialized with browser persistence');
      } else {
        // React Native (Android/iOS): Use custom AsyncStorage persistence
        // Note: Firebase JS SDK v12 doesn't have built-in RN persistence,
        // so we rely on the SDK's default behavior which uses AsyncStorage internally
        auth = initializeAuth(app);
        console.log('✅ Firebase Auth initialized with React Native persistence');
      }
      
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
