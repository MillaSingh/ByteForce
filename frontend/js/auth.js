import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

const googleProvider = new GoogleAuthProvider();

export const signUp = async (fullName, email, password, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      userId: user.uid,
      fullName,
      email,
      role: 'patient',
      createdAt: new Date(),
      ...additionalData
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const googleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email,
        fullName: user.displayName || user.email.split('@')[0],
        role: 'patient',
        createdAt: new Date(),
      });
      return { isNewUser: true, user };
    }
    
    return { isNewUser: false, user };
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserRole = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().role : null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};
