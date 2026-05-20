import { requireAuth, getCurrentUser, logOut } from "./auth.js";

requireAuth();

const user = getCurrentUser();
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhoto = document.getElementById("profilePhoto");
const logoutBtn = document.getElementById("logoutBtn");

//Creates uniquue localStorage key for each user's saved name
const storageKey = `userName_${user.email}`;

function getDisplayName() {
  const savedName = localStorage.getItem(storageKey);
  return savedName || user.name || "";
}

function showNameDisplay(name) {
  profileName.innerHTML = "";

  // Creates the name display area
  const wrapper = document.createElement("section");
  wrapper.className = "profile-name-display";

  const nameText = document.createElement("span");
  nameText.className = "profile-name-text";
  nameText.textContent = name || "Name not available";

  const editBtn = document.createElement("button");
  editBtn.textContent = name ? "Edit name" : "Add name";
  editBtn.id = "editProfileNameBtn";
  editBtn.type = "button";

  editBtn.addEventListener("click", () => {
    showNameForm(name);
  });
//builds the name and button in JavaScript inserts them into the profile section
  wrapper.appendChild(nameText);
  wrapper.appendChild(editBtn);
  profileName.appendChild(wrapper);

  if (name) {
    sessionStorage.setItem("userName", name);
  }
}

function showNameForm(currentName = "") {
  profileName.innerHTML = `
    <section class="profile-name-form">
      <input 
        type="text" 
        id="profileNameInput" 
        placeholder="Enter your name"
        value="${currentName || ""}"
      />
      <button id="saveProfileNameBtn" type="button">Save</button>
      <button id="cancelProfileNameBtn" type="button">Cancel</button>
    </section>
  `;
}

profileEmail.textContent = user.email || "Email not available";

const displayName = getDisplayName();

if (displayName) {
  showNameDisplay(displayName);
} else {
  showNameForm("");
}

if (user.photo) {
  profilePhoto.src = user.photo;
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await logOut();
  });
}

const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "/html/account.html";
  });
}