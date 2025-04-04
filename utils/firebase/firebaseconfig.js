import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyBjxxP0Lyg_A-uyodP8SoYUA3FhQpJ05C8",
  authDomain: "quotify-b565b.firebaseapp.com",
  projectId: "quotify-b565b",
  storageBucket: "quotify-b565b.firebasestorage.app",
  messagingSenderId: "194086294893",
  appId: "1:194086294893:web:cbd7984f0107cc630af664",
  measurementId: "G-GSE69LVV3X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
