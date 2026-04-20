// Firebase config
export const firebaseConfig = {
  apiKey: "AIzaSyDKZteiFERdw_16kz7ijUnoN-VyjW81qt8",
  authDomain: "mediqueue-dc78e.firebaseapp.com",
  projectId: "mediqueue-dc78e",
  storageBucket: "mediqueue-dc78e.firebasestorage.app",
  messagingSenderId: "1070387964825",
  appId: "1:1070387964825:web:140f0cda9d5bbe909cc108",
  measurementId: "G-DJ66KWMP12"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
