const deleteBtn = document.querySelector(".delete");
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

    // Final delete
    finalDeleteBtn.addEventListener("click", () => {
      const password = passwordInput.value;

      if (!password) {
        alert("Please enter your password");
        return;
      }

      // 🔥 Replace this with Supabase delete logic
      console.log("Deleting account with password:", password);

      alert("Account deleted");

      // Redirect to login page
      window.location.href = "/html/login.html";
    });