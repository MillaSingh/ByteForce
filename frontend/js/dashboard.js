import { requireRole, getCurrentUser } from '/js/auth.js';
<<<<<<< HEAD
requireRole(['staff']);

// Stores all patients loaded from the database
let patients = [];

/* ELEMENTS */

// Gets the main table body where patient rows will be displayed
const patientTable = document.getElementById("patientTable");

// Gets the search and filter inputs
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

// Gets the main action buttons
const addPatientBtn = document.getElementById("addPatientBtn");
const rescheduleBtn = document.getElementById("rescheduleBtn");

// Gets the pop-up dialog boxes
const patientDialog = document.getElementById("patientDialog");
const rescheduleDialog = document.getElementById("rescheduleDialog");

// Gets the submit and close buttons for the patient dialog
const submitPatientBtn = document.getElementById("submitPatientBtn");
const closePatientDialogBtn = document.getElementById("closePatientDialogBtn");

// Gets the submit and close buttons for the reschedule dialog
const saveRescheduleBtn = document.getElementById("saveRescheduleBtn");
const closeRescheduleDialogBtn = document.getElementById("closeRescheduleDialogBtn");
=======

// Only staff can access page
requireRole(['staff']);

// Store patients
let patients = [];

/* PAGE ELEMENTS */

const patientTable =
  document.getElementById("patientTable");

const searchInput =
  document.getElementById("searchInput");

const filterStatus =
  document.getElementById("filterStatus");

const addPatientBtn =
  document.getElementById("addPatientBtn");

const rescheduleBtn =
  document.getElementById("rescheduleBtn");

const patientDialog =
  document.getElementById("patientDialog");
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

const rescheduleDialog =
  document.getElementById("rescheduleDialog");

const submitPatientBtn =
  document.getElementById("submitPatientBtn");

const closePatientDialogBtn =
  document.getElementById("closePatientDialogBtn");

const saveRescheduleBtn =
  document.getElementById("saveRescheduleBtn");

const closeRescheduleDialogBtn =
  document.getElementById("closeRescheduleDialogBtn");

const accountBtn =
  document.getElementById("accountBtn");

/* ACCOUNT BUTTON */

// Go to account page
accountBtn.addEventListener("click", () => {

  // Save current page
  sessionStorage.setItem(
    "previousPageBeforeAccount",
    window.location.pathname +
    window.location.search
  );

  // Open account page
  window.location.href =
    "/html/account.html";
});

<<<<<<< HEAD
/* LOAD DASHBOARD TITLE */
=======
/* LOAD CLINIC NAME */
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

// Show clinic name in title
const loadDashboardClinicName = async () => {

  try {

<<<<<<< HEAD
// Gets the current staff user and their linked clinic ID
    const currentUser = getCurrentUser();
    const clinicId = currentUser?.clinicId;
=======
    const currentUser =
      getCurrentUser();
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

    const clinicId =
      currentUser?.clinicId;

    // Stop if no clinic
    if (!clinicId) {

      console.error("No clinicId found");
      return;
    }

<<<<<<< HEAD
//
=======
    // Get clinic data
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
    const response = await fetch(
      `/api/queue/clinics?clinic_id=${clinicId}`
    );

    if (!response.ok) {

      throw new Error(
        "Failed to fetch clinic"
      );
    }

    const clinics =
      await response.json();

    const clinicName =
      clinics[0]?.clinic_name;

    const dashboardTitle =
<<<<<<< HEAD
      document.getElementById("dashboardTitle");
//
=======
      document.getElementById(
        "dashboardTitle"
      );

    // Update title
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
    if (clinicName) {

      dashboardTitle.textContent =
        `Patient Queue Dashboard - ${clinicName}`;
    }

  } catch (error) {

    console.error(
      "Error loading clinic name:",
      error
    );
  }
};

/* LOAD PATIENTS */
<<<<<<< HEAD
//
=======

// Get all patients
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
const loadPatients = async () => {

  try {

    const currentUser =
      getCurrentUser();

    const clinicId =
      currentUser?.clinicId;

    // Stop if no clinic
    if (!clinicId) {

      alert(
        "No clinic assigned to this staff profile."
      );

      return;
    }

<<<<<<< HEAD
 //
=======
    // Fetch patients
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
    const response = await fetch(
      `/api/queue?clinic_id=${clinicId}`
    );

    if (!response.ok) {

      throw new Error(
        "Failed to fetch patients"
      );
    }

    // Save patients
    patients =
      await response.json();

    // Show patients
    renderPatients();

  } catch (error) {

    console.error(
      "Error fetching patients:",
      error
    );
  }
};

/* FORMAT STATUS */

// Convert DB status text
const formatStatus = (status) => {

  const map = {
    waiting: "Waiting",
    in_consultation: "In Consultation",
    complete: "Complete"
  };

  return map[status] || "";
};

<<<<<<< HEAD
/* RENDER PATIENTS */
=======
/* SHOW PATIENTS */
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

// Display patient table
const renderPatients = () => {

  const search =
    searchInput.value.toLowerCase();

  const filter =
    filterStatus.value;

  // Clear old table
  patientTable.innerHTML = "";

  // Filter patients
  const filteredPatients =
    patients.filter(
      ({
        first_name = "",
        last_name = "",
        status = ""
      }) => {

        const fullName =
          `${first_name} ${last_name}`
            .toLowerCase();

        return (
          fullName.includes(search) &&
          (
            filter === "All" ||
            formatStatus(status) === filter
          )
        );
      }
    );

  // Create rows
  filteredPatients.forEach((patient) => {

    const row =
      document.createElement("tr");

    const fullName =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim();

    row.innerHTML = `
      <td>${patient.queue_position || "-"}</td>

      <td>${fullName}</td>

      <td>${patient.email || "-"}</td>

      <td>${patient.phone_number || "-"}</td>

      <td>
        <select 
          class="statusSelect"
          data-id="${patient.queue_id}"
        >

          <option
            value="Waiting"
            ${patient.status === "waiting" ? "selected" : ""}
          >
            Waiting
          </option>

          <option
            value="In Consultation"
            ${patient.status === "in_consultation" ? "selected" : ""}
          >
            In Consultation
          </option>

          <option
            value="Complete"
            ${patient.status === "complete" ? "selected" : ""}
          >
            Complete
          </option>

          <option value="Delete">
            Delete
          </option>

        </select>
      </td>
    `;

    // Status dropdown
    const statusSelect =
      row.querySelector(".statusSelect");
<<<<<<< HEAD
=======

    // Change patient status
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
    statusSelect.addEventListener(
      "change",
      async (e) => {

        const id =
          e.target.dataset.id;

        const value =
          e.target.value;

        // Delete patient
        if (value === "Delete") {

          await deletePatient(id);

        } else {

          // Update status
          await updateStatus(id, value);
        }
      }
    );

    // Add row to table
    patientTable.appendChild(row);
  });
};

/* UPDATE STATUS */

// Change queue status
const updateStatus = async (id, value) => {

  try {

    // Convert status format
    const dbStatus =
      value.toLowerCase()
        .replace(/\s+/g, "_");

    // Send update request
    const response = await fetch(
      `/api/queue/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          status: dbStatus
        })
      }
    );

    if (!response.ok) {

      throw new Error(
        "Failed to update status"
      );
    }

    // Reload table
    await loadPatients();

  } catch (error) {

    console.error(
      "Error updating status:",
      error
    );
  }
};

/* DELETE PATIENT */

// Remove patient from queue
const deletePatient = async (id) => {

  // Confirm delete
  const confirmDelete = confirm(
    "Are you sure you want to remove this patient from the queue?"
  );

  // Stop delete
  if (!confirmDelete) {

    await loadPatients();
    return;
  }

  try {

    // Delete request
    const response = await fetch(
      `/api/queue/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {

      throw new Error(
        "Failed to delete patient"
      );
    }

    // Reload patients
    await loadPatients();

  } catch (error) {

    console.error(
      "Error deleting patient:",
      error
    );

    alert(
      "Error deleting patient"
    );

    await loadPatients();
  }
};

<<<<<<< HEAD
/* DIALOG CONTROLS */
=======
/* DIALOG FUNCTIONS */
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

// Close add patient dialog
const closeDialog = () => {

  patientDialog.close();
};

// Close reschedule dialog
const closeRescheduleDialog = () => {

  rescheduleDialog.close();
};

/* ADD PATIENT */

// Add new walk-in patient
const submitPatient = async () => {

  const first_name =
    document.getElementById("firstName")
      .value.trim();

  const last_name =
    document.getElementById("lastName")
      .value.trim();

  const email =
    document.getElementById("email")
      .value.trim();

  const phone_number =
    document.getElementById("phoneNumber")
      .value.trim();

  const clinic_id =
    getCurrentUser()?.clinicId;

<<<<<<< HEAD
  // Makes form
=======
  // Check fields
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone_number
  ) {

    alert(
      "Please fill in all fields"
    );

    return;
  }

  try {

    // Add patient request
    const response = await fetch(
      "/api/queue/add-walkin",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone_number,
          clinic_id
        })
      }
    );

    if (!response.ok) {

      throw new Error(
        "Failed to add patient"
      );
    }

    // Close dialog
    closeDialog();

    // Reload patients
    await loadPatients();

  } catch (error) {

    console.error(error);

    alert(
      "Error adding patient"
    );
  }
};

<<<<<<< HEAD
/* OPEN RESCHEDULE DIALOG */
=======
/* OPEN RESCHEDULE */
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

// Open reschedule popup
const openRescheduleDialog = () => {

  const dropdown =
    document.getElementById(
      "appointmentSelect"
    );

  // Reset dropdown
  dropdown.innerHTML = `
    <option value="">
      Select Patient
    </option>
  `;

  // Only waiting patients
  const waitingPatients =
    patients.filter(
      patient =>
        patient.status === "waiting" &&
        patient.appointment_id
    );

  // Add dropdown options
  waitingPatients.forEach((patient) => {

    const option =
      document.createElement("option");

    option.value =
      patient.appointment_id;

    option.dataset.patientName =
      `${patient.first_name} ${patient.last_name}`;

    option.dataset.currentDate =
      patient.appointment_date || "";

    option.dataset.currentTime =
      patient.appointment_time || "";

    option.textContent =
      `${patient.first_name} ${patient.last_name}`;

    dropdown.appendChild(option);
  });

  // When patient changes
  dropdown.onchange = () => {

    const selectedOption =
      dropdown.options[
        dropdown.selectedIndex
      ];

    // Show patient name
    document.getElementById(
      "selectedPatientName"
    ).value =
      selectedOption.dataset.patientName || "";

    // Show old date
    document.getElementById(
      "currentAppointmentDate"
    ).value =
      selectedOption.dataset.currentDate || "";

    // Show old time
    document.getElementById(
      "newAppointmentTime"
    ).value =
      selectedOption.dataset.currentTime || "";
  };

  // Open dialog
  rescheduleDialog.showModal();
};

<<<<<<< HEAD
/* SUBMIT RESCHEDULE */
=======
/* SAVE RESCHEDULE */
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90

// Update appointment
const submitReschedule = async () => {

  try {

    const appointmentId =
      document.getElementById(
        "appointmentSelect"
      ).value;

    const appointment_date =
      document.getElementById(
        "newAppointmentDate"
      ).value;

    const appointment_time =
      document.getElementById(
        "newAppointmentTime"
      ).value;

    // Check patient
    if (!appointmentId) {

      alert(
        "Please select a patient"
      );

      return;
    }

    // Check date
    if (!appointment_date) {

      alert(
        "Please select a new date"
      );

      return;
    }

    // Check time
    if (!appointment_time) {

      alert(
        "Please select a time"
      );

      return;
    }

    // Send update request
    const response = await fetch(
      `/api/queue/appointments/${appointmentId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          appointment_date,
          appointment_time
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Failed to reschedule"
      );
    }

    alert(
      "Appointment rescheduled successfully"
    );

    // Close popup
    closeRescheduleDialog();

    // Reload patients
    await loadPatients();

  } catch (error) {

    console.error(
      "Reschedule error:",
      error
    );

    alert(
      "Error rescheduling appointment"
    );
  }
};

/* EVENT LISTENERS */

// Search patients
searchInput.addEventListener(
  "input",
  renderPatients
);

// Filter patients
filterStatus.addEventListener(
  "change",
  renderPatients
);

// Open add patient dialog
addPatientBtn.addEventListener(
  "click",
  () => {

    patientDialog.showModal();
  }
);

// Open reschedule dialog
rescheduleBtn.addEventListener(
  "click",
  openRescheduleDialog
);

// Add patient
submitPatientBtn.addEventListener(
  "click",
  submitPatient
);

// Close add dialog
closePatientDialogBtn.addEventListener(
  "click",
  closeDialog
);

// Save appointment changes
saveRescheduleBtn.addEventListener(
  "click",
  submitReschedule
);

// Close reschedule dialog
closeRescheduleDialogBtn.addEventListener(
  "click",
  closeRescheduleDialog
);

<<<<<<< HEAD
/* INITIAL LOAD */
=======
/* PAGE LOAD */

// Load clinic name
>>>>>>> 00a7e73c6c209dd552e9d10833b19989848fab90
loadDashboardClinicName();

// Load patient data
loadPatients();