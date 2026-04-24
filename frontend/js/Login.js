import { signIn, googleSignIn, authStateListener } from "./auth.js";

const emailLoginForm = document.getElementById("emailLoginForm");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const errorMsg = document.getElementById("errorMsg");
const authStatus = document.getElementById("authStatus");

if (sessionStorage.getItem("firebaseToken")) {
  window.location.href = "/html/home.html";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.style.opacity = loading ? "0.6" : "1";
}

let justLoggedIn = false;

emailLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = emailLoginForm.querySelector('button[type="submit"]');

  setLoading(submitBtn, true);

  try {
    justLoggedIn = true;
    await signIn(email, password);
  } catch (error) {
    justLoggedIn = false;
    setLoading(submitBtn, false);

    const friendlyErrors = {
      "auth/user-not-found": "No account found with that email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/invalid-credential": "Invalid email or password.",
    };
    showError(friendlyErrors[error.code] || error.message);
  }
});

googleSignInBtn.addEventListener("click", async () => {
  clearError();
  setLoading(googleSignInBtn, true);

  try {
    justLoggedIn = true;
    await googleSignIn();
  } catch (error) {
    justLoggedIn = false;
    setLoading(googleSignInBtn, false);

    if (error.code === "auth/popup-closed-by-user") return;
    showError(error.message);
  }
});

authStateListener((user) => {
  if (user && justLoggedIn) {
    authStatus.textContent = `Signed in as ${user.email || user.displayName} — redirecting…`;
    setTimeout(() => {
      window.location.href = "/html/home.html";
    }, 800);
  }
});
