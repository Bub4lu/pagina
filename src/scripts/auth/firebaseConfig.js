// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';  // Importa Firestore


const firebaseConfig = {
  apiKey: "AIzaSyBJCUu8PTUecUNNZsFiEl52GLMPa9wCbm4",
  authDomain: "my-app-b2366.firebaseapp.com",
  projectId: "my-app-b2366",
storageBucket: "my-app-b2366.firebasestorage.app",
  messagingSenderId: "659035208900",
  appId: "1:659035208900:web:16608c5a868902c8529d91",
  measurementId: "G-HV5K1VDBW5"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);   // Exporta db para Firestore

