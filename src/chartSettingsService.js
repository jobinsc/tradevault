// src/chartSettingsService.js
// Saves and loads chart settings from Firebase (per user + per stock)

import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  getDocs,
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════
// GLOBAL CHART SETTINGS (per user - applies to all stocks)
// ═══════════════════════════════════════════════════════════════

export const saveGlobalChartSettings = async (userId, settings) => {
  if (!userId) {
    // Fallback to localStorage if not logged in
    localStorage.setItem('chart_global_settings', JSON.stringify(settings));
    return;
  }
  
  try {
    const ref = doc(db, 'users', userId, 'settings', 'chart_global');
    await setDoc(ref, {
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Also save to localStorage as backup
    localStorage.setItem('chart_global_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save global settings:', e);
    // Fallback to localStorage
    localStorage.setItem('chart_global_settings', JSON.stringify(settings));
  }
};

export const loadGlobalChartSettings = async (userId) => {
  // Try Firebase first
  if (userId) {
    try {
      const ref = doc(db, 'users', userId, 'settings', 'chart_global');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.error('Failed to load global settings from Firebase:', e);
    }
  }
  
  // Fallback to localStorage
  try {
    const saved = localStorage.getItem('chart_global_settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  
  return null;
};

// ═══════════════════════════════════════════════════════════════
// PER-STOCK CHART SETTINGS (drawings, alerts, notes per stock)
// ═══════════════════════════════════════════════════════════════

export const saveStockChartSettings = async (userId, symbol, settings) => {
  const key = symbol.toUpperCase();
  
  if (!userId) {
    // Fallback to localStorage
    const allStocks = JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    allStocks[key] = settings;
    localStorage.setItem('chart_stock_settings', JSON.stringify(allStocks));
    return;
  }
  
  try {
    const ref = doc(db, 'users', userId, 'chartSettings', key);
    await setDoc(ref, {
      ...settings,
      symbol: key,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    // Also save to localStorage as backup
    const allStocks = JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    allStocks[key] = settings;
    localStorage.setItem('chart_stock_settings', JSON.stringify(allStocks));
  } catch (e) {
    console.error('Failed to save stock settings:', e);
    // Fallback to localStorage
    const allStocks = JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    allStocks[key] = settings;
    localStorage.setItem('chart_stock_settings', JSON.stringify(allStocks));
  }
};

export const loadStockChartSettings = async (userId, symbol) => {
  const key = symbol.toUpperCase();
  
  // Try Firebase first
  if (userId) {
    try {
      const ref = doc(db, 'users', userId, 'chartSettings', key);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.error('Failed to load stock settings from Firebase:', e);
    }
  }
  
  // Fallback to localStorage
  try {
    const allStocks = JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    if (allStocks[key]) return allStocks[key];
  } catch (e) {}
  
  return null;
};

// ═══════════════════════════════════════════════════════════════
// LOAD ALL STOCK SETTINGS (for showing which stocks have drawings)
// ═══════════════════════════════════════════════════════════════

export const loadAllStockSettings = async (userId) => {
  if (!userId) {
    try {
      return JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    } catch (e) {
      return {};
    }
  }
  
  try {
    const ref = collection(db, 'users', userId, 'chartSettings');
    const snap = await getDocs(ref);
    const result = {};
    snap.forEach(doc => {
      result[doc.id] = doc.data();
    });
    return result;
  } catch (e) {
    console.error('Failed to load all stock settings:', e);
    try {
      return JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    } catch (err) {
      return {};
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE STOCK SETTINGS
// ═══════════════════════════════════════════════════════════════

export const deleteStockChartSettings = async (userId, symbol) => {
  const key = symbol.toUpperCase();
  
  if (userId) {
    try {
      const ref = doc(db, 'users', userId, 'chartSettings', key);
      await setDoc(ref, { deleted: true }, { merge: true });
    } catch (e) {
      console.error('Failed to delete stock settings:', e);
    }
  }
  
  // Also remove from localStorage
  try {
    const allStocks = JSON.parse(localStorage.getItem('chart_stock_settings') || '{}');
    delete allStocks[key];
    localStorage.setItem('chart_stock_settings', JSON.stringify(allStocks));
  } catch (e) {}
};