// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDls6Fe9iC5sEk8KWAULUxFO3I6t_ZyawU",
  authDomain: "tradevault-994d3.firebaseapp.com",
  projectId: "tradevault-994d3",
  storageBucket: "tradevault-994d3.firebasestorage.app",
  messagingSenderId: "1091497428956",
  appId: "1:1091497428956:web:afa093f2dbe21b7a5fb119",
  measurementId: "G-MJ7S998SJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;