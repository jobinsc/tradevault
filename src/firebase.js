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
// Admin emails - ONLY these emails can access admin panel
export const ADMIN_EMAILS = ['jobinsc@gmail.com'];

// User statuses
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  PENDING: 'pending',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Helper: Check if user is admin
export const isAdmin = (user) => {
  return user && ADMIN_EMAILS.includes(user.email);
};

export default app;
