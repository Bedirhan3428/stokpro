// src/firebase.js
// Güvenli Firebase v9 (modular) init - .env ile çalışır.

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ""
};

const hasRequiredConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let db = null;
let auth = null;
let firebaseEnabled = false;

if (hasRequiredConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    try {
      enableIndexedDbPersistence(db);
    } catch (e) {
      // persistence may fail (multi-tab), ignore
    }
    firebaseEnabled = true;
    console.info("Firebase initialized (projectId):", firebaseConfig.projectId);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.warn("Firebase config incomplete. Set REACT_APP_FIREBASE_* env variables. Firebase disabled for this session.");
}

export { app, db, auth, firebaseEnabled, firebaseConfig };