// frontend/js/account.js
import { logOut, requireAuth, getCurrentUser } from "./auth.js";

requireAuth();

history.pushState(null, "", window.location.href);
window.addEventListener("popstate", () => {
  const token = sessionStorage.getItem("firebaseToken");
  if (!token) {
    window.location.replace("/html/Login.html");
  } else {
    history.pushState(null, "", window.location.href);
  }
});

const user = getCurrentUser();
if (user.name || user.email) {
  const subtitle = document.querySelector(".account-subtitle");
  if (subtitle) {
    subtitle.textContent = `Logged in as ${user.name || user.email}`;
  }
}

const logoutBtn = document.querySelector(".account-btn.logout");

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Logging out…";

  try {
    await logOut();
  } catch (error) {
    console.error("Logout failed:", error);
    logoutBtn.disabled = false;
    logoutBtn.textContent = "Log Out";
    alert("Logout failed. Please try again.");
  }
});

const deleteBtn = document.getElementById("deleteBtn");
const popup = document.getElementById("deletePopup");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const cancelBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const finalDeleteBtn = document.getElementById("finalDelete");
const backBtn = document.getElementById("backBtn");
const passwordInput = document.getElementById("passwordInput");

// Open popup
deleteBtn.addEventListener("click", () => {
  popup.showModal();
  step1.style.display = "block";
  step2.style.display = "none";
  passwordInput.value = "";
});

// Cancel
cancelBtn.addEventListener("click", () => {
  popup.close();
});

// Go to password step
confirmDeleteBtn.addEventListener("click", () => {
  step1.style.display = "none";
  step2.style.display = "block";
});

// Go back
backBtn.addEventListener("click", () => {
  step2.style.display = "none";
  step1.style.display = "block";
});

finalDeleteBtn.addEventListener("click", async () => {
  const password = passwordInput.value;

  if (!password) {
    alert("Please enter your password.");
    return;
  }

  finalDeleteBtn.disabled = true;
  finalDeleteBtn.textContent = "Deleting…";

  try {
    const token = sessionStorage.getItem("firebaseToken");

    const res = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }

    alert("Account deleted successfully.");

    // Clear session and redirect — same as logout
    await logOut();
  } catch (error) {
    console.error("Delete account error:", error);
    alert(error.message || "Failed to delete account. Please try again.");
    finalDeleteBtn.disabled = false;
    finalDeleteBtn.textContent = "Delete Account";
  }
});
