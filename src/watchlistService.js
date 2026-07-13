// src/watchlistService.js
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Add stock to watchlist
export const addToWatchlist = async (userId, symbol) => {
  const key = symbol.toUpperCase();
  
  if (!userId) {
    // Save to localStorage if not logged in
    const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem('watchlist', JSON.stringify(list));
    }
    return;
  }
  
  try {
    const ref = doc(db, 'users', userId, 'watchlist', key);
    await setDoc(ref, {
      symbol: key,
      addedAt: new Date().toISOString(),
    });
    
    // Also save to localStorage
    const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem('watchlist', JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to add to watchlist:', e);
  }
};

// Remove stock from watchlist
export const removeFromWatchlist = async (userId, symbol) => {
  const key = symbol.toUpperCase();
  
  if (userId) {
    try {
      const ref = doc(db, 'users', userId, 'watchlist', key);
      await deleteDoc(ref);
    } catch (e) {
      console.error('Failed to remove from watchlist:', e);
    }
  }
  
  // Remove from localStorage
  const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const updated = list.filter(s => s !== key);
  localStorage.setItem('watchlist', JSON.stringify(updated));
};

// Load user's watchlist
export const loadWatchlist = async (userId) => {
  if (!userId) {
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  }
  
  try {
    const ref = collection(db, 'users', userId, 'watchlist');
    const snap = await getDocs(ref);
    const list = [];
    snap.forEach(doc => {
      list.push(doc.id);
    });
    
    // Sync to localStorage
    localStorage.setItem('watchlist', JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to load watchlist:', e);
    return JSON.parse(localStorage.getItem('watchlist') || '[]');
  }
};

// Check if stock is in watchlist
export const isInWatchlist = (watchlist, symbol) => {
  return watchlist.includes(symbol.toUpperCase());
};