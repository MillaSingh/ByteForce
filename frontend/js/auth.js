import { auth, googleProvider } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

async function storeSession(user) {
  const idToken = await user.getIdToken();
  sessionStorage.setItem("firebaseToken", idToken);
  sessionStorage.setItem("userEmail", user.email || "");
  sessionStorage.setItem("userName", user.displayName || "");
  sessionStorage.setItem("userPhoto", user.photoURL || "");

  // Fetch role from PostgreSQL and store it
  try {
    const response = await fetch("/api/auth/me", {
      headers: { "x-user-email": user.email }
    });
    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem("userRole", data.role || "patient");
    }
  } catch (err) {
    console.error("Failed to fetch user role:", err);
    sessionStorage.setItem("userRole", "patient");
  }

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

export const signUp = async (fullName, email, password, extras = {}) => {
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
      role: extras.role || "patient",
      idNumber: extras.idNumber || null,
      dateOfBirth: extras.dateOfBirth || null,
      password,
    }),
  });

  await storeSession(user);
  return user;
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await storeSession(userCredential.user);
  return userCredential.user;
};

export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

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
      idNumber: null,
      dateOfBirth: null,
      password: null,
    }),
  });

  const data = await response.json();
  await storeSession(user);
  return { isNewUser: data.isNewUser, user };
};

export const logOut = async () => {
  await clearSession();
  await signOut(auth);
  window.location.replace("/html/Login.html");
};

export const authStateListener = (callback) =>
  onAuthStateChanged(auth, callback);

export function requireAuth() {
  if (!sessionStorage.getItem("firebaseToken")) {
    sessionStorage.setItem("intendedPage", window.location.pathname + window.location.search);
    window.location.replace("/html/Login.html");
  }
}

export function requireRole(allowedRoles) {
  if (!sessionStorage.getItem("firebaseToken")) {
    sessionStorage.setItem("intendedPage", window.location.pathname + window.location.search);
    window.location.replace("/html/Login.html");
    return;
  }
  const role = sessionStorage.getItem("userRole");
  if (!allowedRoles.includes(role)) {
    if (role === "staff") {
      window.location.replace("/html/dashboard.html");
    } else if (role === "admin") {
      window.location.replace("/html/admin_dashboard.html");
    } else {
      window.location.replace("/html/home.html");
    }
  }
}

export function getCurrentUser() {
  return {
    email: sessionStorage.getItem("userEmail"),
    name: sessionStorage.getItem("userName"),
    photo: sessionStorage.getItem("userPhoto"),
    token: sessionStorage.getItem("firebaseToken"),
    role: sessionStorage.getItem("userRole")
  };
}
