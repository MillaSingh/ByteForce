import { requireAuth, getCurrentUser } from "/js/auth.js";

// Guard: must be logged in to access this page
requireAuth();

// ── Specialties list ──────────────────────────────────────────────────────────
const SPECIALTIES = [
  "General Practice",
  "Paediatrics",
  "Obstetrics",
  "Gynaecology",
  "Surgery",
  "Nursing",
  "Pharmacy",
  "Radiology",
  "Orthopaedics",
  "Cardiology",
  "Dermatology",
  "Psychiatry",
  "Physiotherapy",
  "Dentistry",
  "Ophthalmology",
  "Emergency Medicine",
  "Other",
];

let selectedSpecialties = [];

// ── Build specialty chips ─────────────────────────────────────────────────────
const chipWrap = document.getElementById("specialty-chips");
SPECIALTIES.forEach((sp) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip";
  btn.textContent = sp;
  btn.addEventListener("click", () => {
    btn.classList.toggle("on");
    selectedSpecialties = btn.classList.contains("on")
      ? [...selectedSpecialties, sp]
      : selectedSpecialties.filter((s) => s !== sp);
  });
  chipWrap.appendChild(btn);
});

// ── Load clinics from API ─────────────────────────────────────────────────────
async function loadClinics() {
  try {
    const res = await fetch("/api/clinics");
    const data = await res.json();
    const sel = document.getElementById("staff-clinic");
    sel.innerHTML = '<option value="">Select your clinic…</option>';
    (data.clinics || data).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.clinic_id;
      opt.textContent = c.clinic_name;
      sel.appendChild(opt);
    });
  } catch {
    document.getElementById("staff-clinic").innerHTML =
      '<option value="">⚠ Could not load clinics</option>';
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function setLoading(btnId, on) {
  const btn = document.getElementById(btnId);
  btn.disabled = on;
  btn.classList.toggle("loading", on);
}

function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  el.className = `alert ${type} show`;
  el.textContent = msg;
}

function clearAlerts() {
  document
    .querySelectorAll(".alert")
    .forEach((a) => a.classList.remove("show"));
}

// ── Role card selection ───────────────────────────────────────────────────────
window.pickRole = function (role) {
  ["patient", "staff", "admin"].forEach((r) =>
    document.getElementById(`card-${r}`).classList.remove("selected"),
  );
  document.getElementById(`card-${role}`).classList.add("selected");
  document
    .querySelectorAll(".sub-panel")
    .forEach((p) => p.classList.remove("active"));
  clearAlerts();

  document.getElementById(`panel-${role}`).classList.add("active");
  document.getElementById("panel-divider").style.display = "block";
  document.getElementById("back-wrap").style.display = "block";

  if (role === "staff") loadClinics();
};

// ── Reset to role card grid ───────────────────────────────────────────────────
window.resetRoles = function () {
  ["patient", "staff", "admin"].forEach((r) =>
    document.getElementById(`card-${r}`).classList.remove("selected"),
  );
  document
    .querySelectorAll(".sub-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("panel-divider").style.display = "none";
  document.getElementById("back-wrap").style.display = "none";
  clearAlerts();
};

// ── Save role (patient or staff) ──────────────────────────────────────────────
window.saveRole = async function (role) {
  const alertId = `${role}-alert`;
  const btnId = `btn-${role}`;
  clearAlerts();
  setLoading(btnId, true);

  const user = getCurrentUser();
  if (!user?.token) {
    showAlert("main-alert", "error", "Session expired. Please log in again.");
    setTimeout(() => (window.location.href = "/html/Login.html"), 2000);
    return;
  }

  try {
    const body = { role };

    if (role === "staff") {
      const clinic = document.getElementById("staff-clinic").value;
      const job = document.getElementById("staff-job").value.trim();
      const quals = document.getElementById("staff-quals").value.trim();
      const bio = document.getElementById("staff-bio").value.trim();

      if (!clinic || !job) {
        showAlert(
          alertId,
          "error",
          "Please select a clinic and enter your job title.",
        );
        setLoading(btnId, false);
        return;
      }

      body.staffProfile = {
        clinic_id: clinic,
        job_title: job,
        qualifications: quals,
        specialties: selectedSpecialties,
        bio,
      };
    }

    const res = await fetch("/api/auth/set-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.email,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.error || "Failed to save role.");

    // Persist role locally so the rest of the app sees it immediately
    sessionStorage.setItem("userRole", role);
    if (role === "staff" && body.staffProfile?.clinic_id) {
      sessionStorage.setItem("clinicId", body.staffProfile.clinic_id);
    }

    showAlert(alertId, "ok", "All set! Redirecting you now…");

    setTimeout(() => {
      if (role === "patient") window.location.href = "/html/home.html";
      if (role === "staff") window.location.href = "/html/dashboard.html";
      if (role === "admin") window.location.href = "/html/admin_dashboard.html";
    }, 1200);
  } catch (err) {
    showAlert(alertId, "error", err.message);
  } finally {
    setLoading(btnId, false);
  }
};

// ── Admin: verify invite code then save role ──────────────────────────────────
window.verifyAdmin = async function () {
  clearAlerts();

  const code = document.getElementById("admin-code").value.trim();
  if (!code) {
    showAlert("admin-alert", "error", "Please enter the invite code.");
    return;
  }

  setLoading("btn-admin", true);

  const user = getCurrentUser();
  if (!user?.token) {
    showAlert("admin-alert", "error", "Session expired. Please log in again.");
    setTimeout(() => (window.location.href = "/html/Login.html"), 2000);
    return;
  }

  try {
    // Step 1: verify the ADMIN_INVITE_CODE against the backend
    const res = await fetch("/api/auth/verify-admin-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user.email,
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Invalid code.");

    // Step 2: code accepted → persist admin role
    await saveRole("admin");
  } catch (err) {
    showAlert("admin-alert", "error", err.message);
    setLoading("btn-admin", false);
  }
};

// ── Toggle invite-code visibility ─────────────────────────────────────────────
window.toggleCode = function () {
  const inp = document.getElementById("admin-code");
  inp.type = inp.type === "password" ? "text" : "password";
};
