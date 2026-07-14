// src/drawingsService.js
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const saveDrawings = async (userId, symbol, drawings) => {
  if (!symbol) return;
  try {
    const key = `drawings_${symbol.toUpperCase()}`;
    localStorage.setItem(key, JSON.stringify(drawings));
    if (userId) {
      const docRef = doc(db, 'users', userId, 'drawings', symbol.toUpperCase());
      await setDoc(docRef, {
        symbol: symbol.toUpperCase(),
        drawings,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error saving drawings:', error);
  }
};

export const loadDrawings = async (userId, symbol) => {
  if (!symbol) return [];
  try {
    if (userId) {
      const docRef = doc(db, 'users', userId, 'drawings', symbol.toUpperCase());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return data.drawings || [];
      }
    }
    const key = `drawings_${symbol.toUpperCase()}`;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return [];
  } catch (error) {
    console.error('Error loading drawings:', error);
    return [];
  }
};

export const clearDrawings = async (userId, symbol) => {
  if (!symbol) return;
  try {
    const key = `drawings_${symbol.toUpperCase()}`;
    localStorage.removeItem(key);
    if (userId) {
      const docRef = doc(db, 'users', userId, 'drawings', symbol.toUpperCase());
      await setDoc(docRef, { drawings: [], updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Error clearing drawings:', error);
  }
};