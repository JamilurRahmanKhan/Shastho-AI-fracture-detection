/**
 * Frontend: firebase
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase config is loaded from Vite env vars.
 *
 * IMPORTANT (DX fix): If you forget to create a .env file, Firebase init can
 * throw and the whole app will render a blank/black screen.
 *
 * To prevent that, we fall back to the project's public web config.
 * (Firebase Web API keys are not secrets; they are expected to be public.)
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCxHdRvV3Zcmr01sPFs5BYwx3J9YjhUrrI",
  authDomain: "shastho-ai.firebaseapp.com",
  projectId: "shastho-ai",
  storageBucket: "shastho-ai.firebasestorage.app",
  messagingSenderId: "132624032500",
  appId: "1:132624032500:web:50f86f1bd24184165a34a1",
  measurementId: "G-VSW178RT3P",
};

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasAllRequiredEnv = Boolean(
  envConfig.apiKey &&
    envConfig.authDomain &&
    envConfig.projectId &&
    envConfig.storageBucket &&
    envConfig.messagingSenderId &&
    envConfig.appId
);

const firebaseConfig = hasAllRequiredEnv
  ? { ...DEFAULT_FIREBASE_CONFIG, ...envConfig }
  : DEFAULT_FIREBASE_CONFIG;

if (!hasAllRequiredEnv) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Firebase] Missing Vite env vars (VITE_FIREBASE_*). Using DEFAULT_FIREBASE_CONFIG. " +
      "If you want to override, create a .env file from .env.example."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
