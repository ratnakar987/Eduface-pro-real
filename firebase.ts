
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, setDoc } from "firebase/firestore";

// These should be provided by the user in .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
const isFirebaseConfigured = !!firebaseConfig.apiKey;

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

export const isUsingFirebase = () => !!db;

// Helper functions for Firestore
export const fsGetDocs = async (colName: string) => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, colName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fsAddDoc = async (colName: string, data: any) => {
  if (!db) return null;
  return await addDoc(collection(db, colName), data);
};

export const fsSetDoc = async (colName: string, id: string, data: any) => {
  if (!db) return null;
  return await setDoc(doc(db, colName, id), data);
};

export const fsUpdateDoc = async (colName: string, id: string, data: any) => {
  if (!db) return null;
  return await updateDoc(doc(db, colName, id), data);
};
