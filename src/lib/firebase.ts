import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have the minimum required config to prevent build errors
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = (getApps().length > 0) 
  ? getApp() 
  : (isConfigValid ? initializeApp(firebaseConfig) : null);

// auth will be null if not initialized, handle in components
const auth: any = app ? getAuth(app) : null;

export { auth };
