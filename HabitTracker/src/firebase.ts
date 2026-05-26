// Pre-initialization environment patch for Electron/Capacitor to bypass offline Firestore errors
if (typeof navigator !== 'undefined') {
  const isElectron = /electron/i.test(navigator.userAgent);
  const isAndroidWebView = /android/i.test(navigator.userAgent) && /wv/i.test(navigator.userAgent);
  const isCapacitor = typeof window !== 'undefined' && ((window as any).Capacitor || isAndroidWebView);

  if (isElectron || isCapacitor) {
    try {
      if (typeof Navigator !== 'undefined' && Navigator.prototype) {
        Object.defineProperty(Navigator.prototype, 'onLine', { get: () => true, configurable: true });
      } else {
        Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
      }
      console.log('[Habitor] Firebase Env Patch: Overrode navigator.onLine to true.');
    } catch (e) {
      console.error('[Habitor] Firebase Env Patch: Failed to override navigator.onLine:', e);
    }
  }
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

// Fallback to placeholder variables if process.env / import.meta.env is empty
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForPreviewTesting12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "habit-tracker-preview.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "habit-tracker-preview",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "habit-tracker-preview.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890abcdef"
};

// Initialize Firebase App (ensure singleton on hot-reload web)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Use initializeFirestore with long-polling to prevent gRPC/WebSocket network blockages in packaged environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any);
export const googleProvider = new GoogleAuthProvider();

// Re-export common Firebase Auth/Firestore helpers for clean imports
export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  doc,
  setDoc,
  getDoc
};
