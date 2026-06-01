import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAqqlpBTHC6k61iY1DfTE1vzmDq9GArHqA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ratnamayuri-c5106.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ratnamayuri-c5106",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ratnamayuri-c5106.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "775859744934",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:775859744934:web:f864d547da48f32d54c467",
  measurementId: "G-HK8STVSTE4"
};

// Prevent duplicate initialization during hot reloads in development
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
