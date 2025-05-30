import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import Firebase messaging correctly
import messaging from '@react-native-firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBjxxP0Lyg_A-uyodP8SoYUA3FhQpJ05C8',
  authDomain: 'quotify-b565b.firebaseapp.com',
  projectId: 'quotify-b565b',
  storageBucket: 'quotify-b565b.firebasestorage.app',
  messagingSenderId: '194086294893',
  appId: '1:194086294893:web:cbd7984f0107cc630af664',
  measurementId: 'G-GSE69LVV3X',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// Export Firebase app and services
export { app, auth, db, storage, messaging };

