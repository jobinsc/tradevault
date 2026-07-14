import { db } from '../firebase';
import {
  collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, query, where
} from 'firebase/firestore';

const COLLECTION = 'screeners';

export const saveScreener = async (screener, userEmail) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...screener,
    userEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getScreeners = async (userEmail) => {
  try {
    // Simple query without orderBy (no index needed!)
    const q = query(
      collection(db, COLLECTION),
      where('userEmail', '==', userEmail)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Sort in JavaScript instead (no index needed!)
    results.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    return results;
  } catch (error) {
    console.error('Error loading screeners:', error);
    return [];
  }
};

export const updateScreener = async (id, updates) => {
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteScreener = async (id) => {
  await deleteDoc(doc(db, COLLECTION, id));
};