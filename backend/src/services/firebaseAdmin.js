const admin = require('firebase-admin');
const config = require('../config');

// Safe parsing of private key supporting both direct string and environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || config.appName.toLowerCase();

if (privateKey && clientEmail) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn('⚠️ Firebase credentials not configured. Firebase Auth functions will be bypassed/unavailable in this environment.');
}

const verifyFirebaseIdToken = async (idToken) => {
  if (!privateKey || !clientEmail) {
    throw new Error('Firebase Admin SDK is not configured in this environment.');
  }
  return admin.auth().verifyIdToken(idToken);
};

module.exports = {
  verifyFirebaseIdToken,
  admin
};
