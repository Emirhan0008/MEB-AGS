import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Firebase Web SDK Configuration retrieved via Firebase MCP
const firebaseConfig = {
  apiKey: "AIzaSyBltRk0TzEmGjqJRF3aj0FzdJ-qodeLrzM",
  authDomain: "meb-ags-firebase-v2.firebaseapp.com",
  projectId: "meb-ags-firebase-v2",
  storageBucket: "meb-ags-firebase-v2.firebasestorage.app",
  messagingSenderId: "488929452470",
  appId: "1:488929452470:web:67908051568da00a606117"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with long-polling enabled to avoid React Native websocket issues on some Android networks
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

// Google Sign-In Yapılandırması
// Lütfen Firebase Console'da Google sağlayıcısını aktif edip Web Client ID'yi buraya girin.
GoogleSignin.configure({
  webClientId: '488929452470-utdanjp5smq1knbl4q1o99m36mj9tler.apps.googleusercontent.com',
  offlineAccess: true,
});

export { app, auth, db };

