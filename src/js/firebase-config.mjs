/**
 * Firebase Configuration Module
 * 
 * Initializes Firebase services for the frontend.
 * Uses environment variables for configuration.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize FCM (optional, check browser support)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

// Cloud Functions base URL (dynamic based on environment)
export let FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 
  `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net`;

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  const { connectFunctionsEmulator } = await import('firebase/functions');
  // Need to get functions instance if we were using callable, but for fetch we just need URL
  
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Update functions URL for local emulator
  FUNCTIONS_URL = `http://127.0.0.1:5001/${firebaseConfig.projectId}/us-central1`;
  
  console.log('🔧 Connected to Firebase Emulators');
  console.log('📍 Functions URL:', FUNCTIONS_URL);
}

export default app;
