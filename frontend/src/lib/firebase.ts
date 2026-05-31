import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmxJe4SQxoD0jk7GlkR8rYbrfwXBX4wsI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ratnamayuri-50325.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ratnamayuri-50325",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ratnamayuri-50325.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "658052427507",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:658052427507:web:59b55d91c786876c95d186",
  measurementId: "G-BELYFQR9YN"
};

// Prevent duplicate initialization during hot reloads in development
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
