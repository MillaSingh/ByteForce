// frontend/js/auth.js
import { auth, googleProvider } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ─── Session helpers ──────────────────────────────────────────────────────────
async function storeSession(user) {
  const idToken = await user.getIdToken();
  sessionStorage.setItem("firebaseToken", idToken);
  sessionStorage.setItem("userEmail", user.email || "");
  sessionStorage.setItem("userName", user.displayName || "");
  sessionStorage.setItem("userPhoto", user.photoURL || "");

  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

async function clearSession() {
  sessionStorage.clear();
  await fetch("/api/auth/session", { method: "DELETE" });
}

// ─── Register (email + password) ─────────────────────────────────────────────
// fullName is split into first/last to match the Postgres "user" table schema
export const signUp = async (fullName, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  const [firstName, ...rest] = (fullName || "").trim().split(" ");
  const lastName = rest.join(" ") || "";

  await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      firstName,
      lastName,
      email,
      role: "patient",
    }),
  });

  await storeSession(user);
  return user;
};

// ─── Email / password sign-in ─────────────────────────────────────────────────
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await storeSession(userCredential.user);
  return userCredential.user;
};

// ─── Google sign-in ───────────────────────────────────────────────────────────
export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Split Google display name into first + last for Postgres schema
  const [firstName, ...rest] = (user.displayName || user.email.split("@")[0])
    .trim()
    .split(" ");
  const lastName = rest.join(" ") || "";

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      firstName,
      lastName,
      email: user.email,
      role: "patient",
    }),
  });

  const data = await response.json();
  await storeSession(user);
  return { isNewUser: data.isNewUser, user };
};

// ─── Sign out ─────────────────────────────────────────────────────────────────
export const logOut = async () => {
  await clearSession();
  await signOut(auth);
  window.location.href = "/html/Login.html";
};

// ─── Auth state listener ──────────────────────────────────────────────────────
export const authStateListener = (callback) =>
  onAuthStateChanged(auth, callback);

// ─── Guard: redirect to login if not authenticated ────────────────────────────
export function requireAuth() {
  if (!sessionStorage.getItem("firebaseToken")) {
    window.location.href = "/html/Login.html";
  }
}

// ─── Get stored user info without a round-trip ───────────────────────────────
export function getCurrentUser() {
  return {
    email: sessionStorage.getItem("userEmail"),
    name: sessionStorage.getItem("userName"),
    photo: sessionStorage.getItem("userPhoto"),
    token: sessionStorage.getItem("firebaseToken"),
  };
}
