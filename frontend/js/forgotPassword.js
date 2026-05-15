import { sendPasswordReset } from "./auth.js";

const form = document.getElementById("forgotPasswordForm");
const sendBtn = document.getElementById("sendBtn");
const errorMsg = document.getElementById("errorMsg");
const stepEmail = document.getElementById("step-email");
const stepSuccess = document.getElementById("step-success");
const sentToEmail = document.getElementById("sentToEmail");
const resendLink = document.getElementById("resendLink");
const resendMsg = document.getElementById("resendMsg");

let lastEmail = "";

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  sendBtn.style.opacity = loading ? "0.6" : "1";
  sendBtn.textContent = loading ? "Sending…" : "Send Reset Link";
}

async function sendReset(email) {
  await sendPasswordReset(email);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = document.getElementById("email").value.trim();
  lastEmail = email;
  setLoading(true);

  try {
    await sendReset(email);
    stepEmail.style.display = "none";
    stepSuccess.style.display = "block";
    sentToEmail.textContent = email;
  } catch (error) {
    setLoading(false);
    const friendlyErrors = {
      "auth/user-not-found": "No account found with that email address.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/too-many-requests":
        "Too many requests. Please wait a moment and try again.",
    };
    showError(friendlyErrors[error.code] || error.message);
  }
});

resendLink.addEventListener("click", async (e) => {
  e.preventDefault();
  resendLink.style.pointerEvents = "none";
  resendMsg.style.display = "none";

  try {
    await sendReset(lastEmail);
    resendMsg.textContent = "Email resent successfully!";
    resendMsg.style.color = "green";
    resendMsg.style.display = "block";
  } catch (error) {
    resendMsg.textContent = "Failed to resend. Please try again.";
    resendMsg.style.color = "red";
    resendMsg.style.display = "block";
  } finally {
    // Re-enable after 30 seconds to prevent spam
    setTimeout(() => {
      resendLink.style.pointerEvents = "auto";
    }, 30000);
  }
});
