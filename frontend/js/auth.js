import { auth, googleProvider } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ─── storeSession ─────────────────────────────────────────────────────────────
// Saves Firebase token + user info to sessionStorage, then registers the
// session cookie server-side so requireAuth (cookie path) works too.
// The /me fetch is best-effort — it may 404 for brand-new users who haven't
// had their DB row created yet (Google sign-in new users), so we catch quietly.
async function storeSession(user) {
  const idToken = await user.getIdToken();
  sessionStorage.setItem("firebaseToken", idToken);
  sessionStorage.setItem("userEmail", user.email || "");
  sessionStorage.setItem("userName", user.displayName || "");
  sessionStorage.setItem("userPhoto", user.photoURL || "");

  // Fetch existing role from DB (best-effort — may be null for new users)
  try {
    const res = await fetch("/api/auth/me", {
      headers: { "x-user-email": user.email },
    });
    if (res.ok) {
      const data = await res.json();
      sessionStorage.setItem("userRole", data.role || "");
      sessionStorage.setItem("clinicId", data.clinic_id || "");
    } else {
      // 404 = new user, no DB row yet — role will be set on select_role.html
      sessionStorage.setItem("userRole", "");
      sessionStorage.setItem("clinicId", "");
    }
  } catch {
    sessionStorage.setItem("userRole", "");
    sessionStorage.setItem("clinicId", "");
  }

  // Register the session cookie so the cookie-based requireAuth path works
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

// ─── clearSession ─────────────────────────────────────────────────────────────
async function clearSession() {
  sessionStorage.clear();
  await fetch("/api/auth/session", { method: "DELETE" });
}

// ─── redirectAfterLogin ───────────────────────────────────────────────────────
// Asks the backend where to send this user based on their DB role.
//   null / ""  →  /html/select_role.html   (first-time, no role yet)
//   patient    →  /html/home.html
//   staff      →  /html/dashboard.html
//   admin      →  /html/admin_dashboard.html
async function redirectAfterLogin(user) {
  try {
    const res = await fetch("/api/auth/check-role", {
      headers: { "x-user-email": user.email },
    });
    if (!res.ok) throw new Error("check-role failed");
    const data = await res.json();
    window.location.href = data.redirect;
  } catch {
    // Fallback — send to role selection if we can't determine role
    window.location.href = "/html/select_role.html";
  }
}

// ─── signUp ───────────────────────────────────────────────────────────────────
// Called from verify-otp.js after the OTP is confirmed.
// Creates the Firebase user, registers them in Postgres, stores the session.
// Does NOT redirect — verify-otp.js redirects to /html/select_role.html.
export const signUp = async (fullName, email, password, extras = {}) => {
  // 1. Create Firebase user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  const [firstName, ...rest] = (fullName || "").trim().split(" ");
  const lastName = rest.join(" ") || "";

  // 2. Register in Postgres — role is null, set later on select_role.html
  const registerRes = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid, // Firebase UID — required by /register
      firstName,
      lastName,
      email,
      role: null, // ✅ always null — chosen on select_role.html
      idNumber: extras.idNumber || null,
      dateOfBirth: extras.dateOfBirth || null,
      password, // sent so backend can hash it for non-Firebase login
    }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json().catch(() => ({}));
    console.error("Register API error:", err);
    // Don't throw — Firebase user was created, session can still proceed.
    // The user row may already exist (duplicate registration attempt).
  }

  // 3. Store session (sets firebaseToken in sessionStorage + cookie)
  await storeSession(user);

  return user;
};

// ─── signIn ───────────────────────────────────────────────────────────────────
export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await storeSession(userCredential.user);
  await redirectAfterLogin(userCredential.user);
  return userCredential.user;
};

// ─── googleSignIn ─────────────────────────────────────────────────────────────
export const googleSignIn = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const [firstName, ...rest] = (user.displayName || user.email.split("@")[0])
    .trim()
    .split(" ");
  const lastName = rest.join(" ") || "";

  // Register in Postgres (upsert — safe to call on every Google login)
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      firstName,
      lastName,
      email: user.email,
      role: null,
      idNumber: null,
      dateOfBirth: null,
      password: null,
    }),
  });

  const data = await response.json();
  await storeSession(user);
  await redirectAfterLogin(user);
  return { isNewUser: data.isNewUser, user };
};

// ─── logOut ───────────────────────────────────────────────────────────────────
export const logOut = async () => {
  await clearSession();
  await signOut(auth);
  window.location.replace("/html/Login.html");
};

// ─── authStateListener ────────────────────────────────────────────────────────
export const authStateListener = (callback) =>
  onAuthStateChanged(auth, callback);

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Redirects to login if no Firebase token in sessionStorage.
export function requireAuth() {
  if (!sessionStorage.getItem("firebaseToken")) {
    sessionStorage.setItem(
      "intendedPage",
      window.location.pathname + window.location.search,
    );
    window.location.replace("/html/Login.html");
  }
}

// ─── requireRole ──────────────────────────────────────────────────────────────
// Redirects to login, role selection, or the user's own dashboard
// if they try to access a page their role doesn't allow.
export function requireRole(allowedRoles) {
  if (!sessionStorage.getItem("firebaseToken")) {
    sessionStorage.setItem(
      "intendedPage",
      window.location.pathname + window.location.search,
    );
    window.location.replace("/html/Login.html");
    return;
  }

  const role = sessionStorage.getItem("userRole");

  if (!role) {
    window.location.replace("/html/select_role.html");
    return;
  }

  if (!allowedRoles.includes(role)) {
    const dashboards = {
      staff: "/html/dashboard.html",
      admin: "/html/admin_dashboard.html",
    };
    window.location.replace(dashboards[role] || "/html/home.html");
  }
}

// ─── getCurrentUser ───────────────────────────────────────────────────────────
export function getCurrentUser() {
  return {
    email: sessionStorage.getItem("userEmail"),
    name: sessionStorage.getItem("userName"),
    photo: sessionStorage.getItem("userPhoto"),
    token: sessionStorage.getItem("firebaseToken"),
    role: sessionStorage.getItem("userRole"),
    clinicId: sessionStorage.getItem("clinicId"),
  };
}

// ─── Password Reset ───────────────────────────────────────────────────────────
export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function verifyResetCode(oobCode) {
  return await verifyPasswordResetCode(auth, oobCode);
}

export async function confirmPasswordReset(oobCode, newPassword, email) {
  await firebaseConfirmPasswordReset(auth, oobCode, newPassword);

  const response = await fetch("/api/auth/sync-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.warn("Password sync to DB failed:", err.error || "Unknown error");
  }
}
