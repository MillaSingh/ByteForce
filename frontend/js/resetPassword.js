import { confirmPasswordReset, verifyResetCode } from "./auth.js";

const stepLoading = document.getElementById("step-loading");
const stepInvalid = document.getElementById("step-invalid");
const stepForm = document.getElementById("step-form");
const stepSuccess = document.getElementById("step-success");
const form = document.getElementById("resetPasswordForm");
const resetBtn = document.getElementById("resetBtn");
const errorMsg = document.getElementById("errorMsg");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const strengthFill = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get("oobCode");

let verifiedEmail = null;

// ── Password strength meter ───────────────────────────────────────────────────
function checkStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "", color: "#ddd", width: "0%" },
    { label: "Very weak", color: "#e53e3e", width: "20%" },
    { label: "Weak", color: "#dd6b20", width: "40%" },
    { label: "Fair", color: "#d69e2e", width: "60%" },
    { label: "Strong", color: "#38a169", width: "80%" },
    { label: "Very strong", color: "#2f855a", width: "100%" },
  ];

  const level = levels[Math.min(score, 5)];
  strengthFill.style.width = level.width;
  strengthFill.style.background = level.color;
  strengthLabel.textContent = level.label;
  strengthLabel.style.color = level.color;
}

newPasswordInput.addEventListener("input", () =>
  checkStrength(newPasswordInput.value),
);

// ── Verify the oobCode on page load ──────────────────────────────────────────
async function init() {
  if (!oobCode) {
    showStep("invalid");
    return;
  }

  try {
    verifiedEmail = await verifyResetCode(oobCode);
    showStep("form");
  } catch {
    showStep("invalid");
  }
}

function showStep(step) {
  stepLoading.style.display = "none";
  stepInvalid.style.display = step === "invalid" ? "block" : "none";
  stepForm.style.display = step === "form" ? "block" : "none";
  stepSuccess.style.display = step === "success" ? "block" : "none";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
}

function clearError() {
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
}

function setLoading(loading) {
  resetBtn.disabled = loading;
  resetBtn.style.opacity = loading ? "0.6" : "1";
  resetBtn.textContent = loading ? "Updating…" : "Update Password";
}

// ── Handle form submit ────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  if (newPassword.length < 8) {
    showError("Password must be at least 8 characters.");
    return;
  }

  setLoading(true);

  try {
    // confirmPasswordReset handles both Firebase + PostgreSQL sync internally
    await confirmPasswordReset(oobCode, newPassword, verifiedEmail);

    showStep("success");
    startCountdown();
  } catch (error) {
    setLoading(false);
    const friendlyErrors = {
      "auth/expired-action-code":
        "This reset link has expired. Please request a new one.",
      "auth/invalid-action-code": "This reset link is invalid or already used.",
      "auth/weak-password":
        "Password is too weak. Please choose a stronger password.",
      "auth/user-disabled": "This account has been disabled.",
    };
    showError(friendlyErrors[error.code] || error.message);
  }
});

function startCountdown() {
  let seconds = 5;
  const countdownEl = document.getElementById("countdown");
  const interval = setInterval(() => {
    seconds--;
    countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      window.location.replace("/html/Login.html");
    }
  }, 1000);
}

init();
