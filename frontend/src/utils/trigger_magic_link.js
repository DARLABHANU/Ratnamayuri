// Programmatic client dispatch test script
const { initializeApp } = require('firebase/app');
const { getAuth, sendSignInLinkToEmail } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAqqlpBTHC6k61iY1DfTE1vzmDq9GArHqA",
  authDomain: "ratnamayuri-c5106.firebaseapp.com",
  projectId: "ratnamayuri-c5106",
  storageBucket: "ratnamayuri-c5106.firebasestorage.app",
  messagingSenderId: "775859744934",
  appId: "1:775859744934:web:f864d547da48f32d54c467",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = process.argv[2] || "darlabhanumurthy@gmail.com";

async function run() {
  console.log(`[Firebase Test] Initializing dispatch test to: ${email}...`);
  try {
    const actionCodeSettings = {
      url: "https://www.ratnamayuri.me/auth/verify-link",
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    console.log("✅ Success! Firebase Client SDK reports the magic link email has been dispatched successfully.");
    console.log(`[Firebase Test] Please check the inbox (and Spam/Junk folder) of: ${email}`);
  } catch (err) {
    console.error("❌ Firebase SDK rejected link dispatch:", err.message);
    console.log("   Suggestion: Make sure 'Email link (passwordless sign-in)' is turned ON under native Email/Password providers in your Firebase console.");
  }
  process.exit(0);
}

run();
