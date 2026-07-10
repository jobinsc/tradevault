// src/dataService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, USER_STATUS } from './firebase';

// ============ USER PROFILE ============

// Create user profile on signup
export const createUserProfile = async (user) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      status: USER_STATUS.ACTIVE, // Auto-approve for now
      role: 'user',
      capital: 100000,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return { isNew: true };
  } else {
    // Update last login
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
    return { isNew: false, data: userSnap.data() };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// Update user capital
export const updateUserCapital = async (userId, capital) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { capital });
};

// ============ TRADES ============

// Get all trades for a user
export const getTrades = async (userId) => {
  const tradesRef = collection(db, 'users', userId, 'trades');
  const q = query(tradesRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Add a trade
export const addTrade = async (userId, trade) => {
  const tradesRef = collection(db, 'users', userId, 'trades');
  const docRef = await addDoc(tradesRef, {
    ...trade,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Update a trade
export const updateTrade = async (userId, tradeId, updates) => {
  const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
  await updateDoc(tradeRef, updates);
};

// Delete a trade
export const deleteTrade = async (userId, tradeId) => {
  const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
  await deleteDoc(tradeRef);
};

// Bulk add trades (for import)
export const bulkAddTrades = async (userId, trades) => {
  const promises = trades.map(trade => addTrade(userId, trade));
  return Promise.all(promises);
};

// ============ RULES ============

export const getRules = async (userId) => {
  const rulesRef = collection(db, 'users', userId, 'rules');
  const snapshot = await getDocs(rulesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveRules = async (userId, rules) => {
  // Delete all existing rules
  const existing = await getRules(userId);
  await Promise.all(existing.map(r => 
    deleteDoc(doc(db, 'users', userId, 'rules', r.id))
  ));
  
  // Add new rules
  const rulesRef = collection(db, 'users', userId, 'rules');
  await Promise.all(rules.map(rule => 
    addDoc(rulesRef, { text: rule.text, checked: rule.checked || false })
  ));
};

// ============ ADMIN FUNCTIONS ============

// Get ALL users (admin only)
export const getAllUsers = async () => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update user status (admin only)
export const updateUserStatus = async (userId, status) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { status });
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  // Delete all trades
  const trades = await getTrades(userId);
  await Promise.all(trades.map(t => deleteTrade(userId, t.id)));
  
  // Delete all rules
  const rules = await getRules(userId);
  await Promise.all(rules.map(r => 
    deleteDoc(doc(db, 'users', userId, 'rules', r.id))
  ));
  
  // Delete user profile
  const userRef = doc(db, 'users', userId);
  await deleteDoc(userRef);
};

// ============ MIGRATION HELPER ============

// Migrate localStorage data to Firebase (one-time)
export const migrateLocalDataToCloud = async (userId) => {
  try {
    // Get local data
    const localTrades = JSON.parse(localStorage.getItem('tv_trades') || '[]');
    const localCapital = JSON.parse(localStorage.getItem('tv_capital') || '100000');
    const localRules = JSON.parse(localStorage.getItem('tv_rules') || '[]');
    
    if (localTrades.length === 0 && localRules.length === 0) {
      return { migrated: false, message: 'No local data to migrate' };
    }
    
    // Upload to Firebase
    if (localTrades.length > 0) {
      await bulkAddTrades(userId, localTrades);
    }
    
    if (localCapital) {
      await updateUserCapital(userId, localCapital);
    }
    
    if (localRules.length > 0) {
      await saveRules(userId, localRules);
    }
    
    // Mark as migrated
    localStorage.setItem('tv_migrated', 'true');
    
    return { 
      migrated: true, 
      trades: localTrades.length,
      rules: localRules.length,
      capital: localCapital
    };
  } catch (error) {
    console.error('Migration error:', error);
    return { migrated: false, error: error.message };
  }
};