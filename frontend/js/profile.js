import { requireAuth, getCurrentUser, logOut } from "./auth.js";

requireAuth();

const user = getCurrentUser();

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhoto = document.getElementById("profilePhoto");
const logoutBtn = document.getElementById("logoutBtn");

profileName.textContent = user.name || "Name not available";
profileEmail.textContent = user.email || "Email not available";

if (user.photo) {
  profilePhoto.src = user.photo;
}

logoutBtn.addEventListener("click", async () => {
  await logOut();
});