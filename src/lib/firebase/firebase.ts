import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Hardcoded Firebase configuration
// This is safe to expose in client-side code for web Firebase apps
const firebaseConfig = {
  apiKey: "AIzaSyADE1YJ_yI_yC4LmXWa59FwQ8ol1KoETZg",
  authDomain: "care-assessor-ai.firebaseapp.com",
  projectId: "care-assessor-ai",
  storageBucket: "care-assessor-ai.appspot.com",
  messagingSenderId: "419776479998",
  appId: "1:419776479998:web:4dea83919a9a4373939baf"
};

// Initialize Firebase
console.log("Initializing Firebase...");

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseInitialized = false;

// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log("Firestore persistence enabled");
      })
      .catch((err) => {
        console.warn("Firestore persistence couldn't be enabled:", err.code);
      });
    
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error; // Re-throw the error to handle it in the app
  }
} else {
  // Server-side initialization with empty app
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, firebaseInitialized };
