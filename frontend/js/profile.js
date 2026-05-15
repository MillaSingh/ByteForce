import { requireAuth, getCurrentUser, logOut } from "./auth.js";

requireAuth();

const user = getCurrentUser();

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhoto = document.getElementById("profilePhoto");
const logoutBtn = document.getElementById("logoutBtn");

const storageKey = `userName_${user.email}`;

function getDisplayName() {
  const savedName = localStorage.getItem(storageKey);
  // return user.name || savedName || "";
  return savedName || user.name || "";
}

function showNameDisplay(name) {
  profileName.innerHTML = "";

  const wrapper = document.createElement("div");
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

  wrapper.appendChild(nameText);
  wrapper.appendChild(editBtn);
  profileName.appendChild(wrapper);

  if (name) {
    sessionStorage.setItem("userName", name);
  }
}

function showNameForm(currentName = "") {
  profileName.innerHTML = `
    <div class="profile-name-form">
      <input 
        type="text" 
        id="profileNameInput" 
        placeholder="Enter your name"
        value="${currentName || ""}"
      />
      <button id="saveProfileNameBtn" type="button">Save</button>
      <button id="cancelProfileNameBtn" type="button">Cancel</button>
    </div>
  `;

  const nameInput = document.getElementById("profileNameInput");
  const saveNameBtn = document.getElementById("saveProfileNameBtn");
  const cancelNameBtn = document.getElementById("cancelProfileNameBtn");

  saveNameBtn.addEventListener("click", () => {
    const enteredName = nameInput.value.trim();

    if (!enteredName) {
      alert("Please enter your name.");
      return;
    }

    sessionStorage.setItem("userName", enteredName);
    localStorage.setItem(storageKey, enteredName);

    showNameDisplay(enteredName);
  });

  cancelNameBtn.addEventListener("click", () => {
    showNameDisplay(getDisplayName());
  });
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