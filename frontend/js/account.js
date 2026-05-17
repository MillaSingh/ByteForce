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

const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    const previousPage = sessionStorage.getItem("previousPageBeforeAccount");

    if (previousPage) {
      window.location.href = previousPage;
    } else {
      window.history.back();
    }
  });
}

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

