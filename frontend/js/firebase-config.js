import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Replace these values with your Firebase project config
// Firebase Console → Project Settings → Your apps → Web app → Config
const firebaseConfig = {
  apiKey: "AIzaSyCnJSYTyPwR9G-FX_dirZ_1XX-KI7iQbu0",
  authDomain: "byteforce-87933.firebaseapp.com",
  projectId: "byteforce-87933",
  storageBucket: "byteforce-87933.firebasestorage.app",
  messagingSenderId: "352686247671",
  appId: "1:352686247671:web:d98a278a6fa229a99b0df2",
  measurementId: "G-27522VM6Y7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// export const db = getFirestore(app);
