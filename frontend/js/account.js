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

deleteBtn.addEventListener("click", async () => {
  deleteBtn.disabled = true;
  deleteBtn.textContent = "Deleting…";

  try {
    const token = sessionStorage.getItem("firebaseToken");

    const res = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Delete failed");
    }

    alert("Account deleted successfully.");
    await logOut();
  } catch (error) {
    console.error("Delete account error:", error);
    alert(error.message || "Failed to delete account. Please try again.");
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Delete Account";
  }
});
