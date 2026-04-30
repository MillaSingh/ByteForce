import { signIn, googleSignIn } from "./auth.js";

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
    await signIn(email, password);
    // Redirect directly here
    authStatus.textContent = `Signed in — redirecting…`;
    setTimeout(() => {
      window.location.href = "/html/home.html";
    }, 800);
  } catch (error) {
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
    await googleSignIn();
    // Redirect directly here instead of relying on authStateListener
    authStatus.textContent = `Signed in — redirecting…`;
    setTimeout(() => {
      window.location.href = "/html/home.html";
    }, 800);
  } catch (error) {
    setLoading(googleSignInBtn, false);
    if (error.code === "auth/popup-closed-by-user") return;
    showError(error.message);
  }
});
