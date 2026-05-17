import { requireRole, getCurrentUser } from '/js/auth.js';

requireRole(['staff']);

// GLOBAL VARIABLE
let patients = [];

// LOAD CLINIC NAME INTO DASHBOARD TITLE
const loadDashboardClinicName = async () => {

  try {

    const currentUser = getCurrentUser();
    const clinicId = currentUser.clinicId;

    console.log("TITLE CURRENT USER:", currentUser);
    console.log("TITLE CLINIC ID:", clinicId);

    if (!clinicId) {
      console.error("No clinicId found for title");
      return;
    }

    const response = await fetch(
      `/api/queue/clinics?clinic_id=${clinicId}`
    );

    console.log("TITLE CLINIC RESPONSE STATUS:", response.status);

    if (!response.ok) {
      throw new Error("Failed to fetch clinic");
    }

    const clinics = await response.json();

    console.log("TITLE CLINICS RETURNED:", clinics);

    const clinicName = clinics[0]?.clinic_name;

    const dashboardTitle =
      document.getElementById("dashboardTitle") ||
      document.querySelector(".hero h1");

    if (!dashboardTitle) {
      console.error("Dashboard title element not found");
      return;
    }

    if (clinicName) {

      dashboardTitle.textContent =
        `Patient Queue Dashboard - ${clinicName}`;

    } else {

      console.error("No clinic name returned");
    }

  } catch (error) {

    console.error(
      "Error loading dashboard clinic name:",
      error
    );
  }
};


// LOAD PATIENTS
const loadPatients = async () => {

  try {

    const currentUser = getCurrentUser();
    const clinicId = currentUser.clinicId;

    console.log("CURRENT USER:", currentUser);
    console.log("DASHBOARD CLINIC ID:", clinicId);

    if (!clinicId) {

      console.error(
        "No clinicId found for this staff user"
      );

      alert(
        "No clinic assigned to this staff profile."
      );

      return;
    }

    const response = await fetch(
      `/api/queue?clinic_id=${clinicId}`
    );

    console.log(
      "QUEUE RESPONSE STATUS:",
      response.status
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    patients = await response.json();

    console.log("PATIENTS RETURNED:", patients);

    renderPatients();

  } catch (error) {

    console.error(
      "Error fetching patients:",
      error
    );
  }
};


// FORMAT STATUS
const formatStatus = (status) => {

  const map = {
    waiting: "Waiting",
    in_consultation: "In Consultation",
    complete: "Complete"
  };

  return map[status] ?? "";
};


// RENDER PATIENT TABLE
const renderPatients = () => {

  const table =
    document.getElementById("patientTable");

  const search =
    document.getElementById("searchInput")
      .value
      .toLowerCase();

  const filter =
    document.getElementById("filterStatus")
      .value;

  table.innerHTML = "";

  patients
    .filter(({ first_name = "", last_name = "", status }) => {

      const fullName =
        `${first_name} ${last_name}`.toLowerCase();

      return (
        fullName.includes(search) &&
        (
          filter === "All" ||
          formatStatus(status) === filter
        )
      );
    })

    .forEach((patient) => {

      const fullName =
        `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();

      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td>${patient.queue_position ?? "-"}</td>

        <td>${fullName}</td>

        <td>${patient.email ?? "-"}</td>

        <td>${patient.phone_number ?? "-"}</td>

        <td>
          <select data-id="${patient.queue_id}">
            
            <option value="Waiting"
              ${patient.status === "waiting" ? "selected" : ""}>
              Waiting
            </option>

            <option value="In Consultation"
              ${patient.status === "in_consultation" ? "selected" : ""}>
              In Consultation
            </option>

            <option value="Complete"
              ${patient.status === "complete" ? "selected" : ""}>
              Complete
            </option>

            <option value="Delete">
              Delete
            </option>

          </select>
        </td>
      `;

      row
        .querySelector("select")
        .addEventListener("change", (e) => {

          const id = e.target.dataset.id;
          const value = e.target.value;

          if (value === "Delete") {

            deletePatient(id);

          } else {

            updateStatus(id, value);
          }
        });

      table.appendChild(row);
    });
};


// UPDATE STATUS
const updateStatus = async (id, value) => {

  const dbStatus =
    value.toLowerCase().replace(/\s+/g, "_");

  try {

    const response = await fetch(
      `/api/queue/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          status: dbStatus
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    await loadPatients();

  } catch (error) {

    console.error(
      "Error updating status:",
      error
    );
  }
};


// DELETE PATIENT
const deletePatient = async (id) => {

  const confirmDelete = confirm(
    "Are you sure you want to remove this patient from the queue?"
  );

  if (!confirmDelete) {

    await loadPatients();
    return;
  }

  try {

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

    await loadPatients();

  } catch (error) {

    console.error(
      "Error deleting patient:",
      error
    );

    alert("Error deleting patient");

    await loadPatients();
  }
};


// EVENT LISTENERS
document
  .getElementById("searchInput")
  .addEventListener("input", renderPatients);

document
  .getElementById("filterStatus")
  .addEventListener("change", renderPatients);


// OPEN ADD PATIENT DIALOG
document
  .getElementById("addPatientBtn")
  .addEventListener("click", () => {

    document
      .getElementById("patientDialog")
      .showModal();
  });


// OPEN RESCHEDULE DIALOG
document
  .getElementById("rescheduleBtn")
  .addEventListener("click", () => {

    const dropdown =
      document.getElementById(
        "appointmentSelect"
      );

    dropdown.innerHTML = `
      <option value="">
        Select Patient
      </option>
    `;

    // ONLY SHOW WAITING PATIENTS
    const waitingPatients =
      patients.filter(
        patient =>
          patient.status === "waiting" &&
          patient.appointment_id
      );

    waitingPatients.forEach((patient) => {

      const option =
        document.createElement("option");

      option.value =
        patient.appointment_id;

      // STORE EXTRA DATA
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

    // UPDATE DETAILS WHEN SELECT CHANGES
    dropdown.onchange = () => {

      const selectedOption =
        dropdown.options[
          dropdown.selectedIndex
        ];

      document.getElementById(
        "selectedPatientName"
      ).value =
        selectedOption.dataset.patientName || "";

      document.getElementById(
        "currentAppointmentDate"
      ).value =
        selectedOption.dataset.currentDate || "";

      document.getElementById(
        "newAppointmentTime"
      ).value =
        selectedOption.dataset.currentTime || "";
    };

    document
      .getElementById("rescheduleDialog")
      .showModal();
  });


// CLOSE ADD PATIENT DIALOG
function closeDialog() {

  document
    .getElementById("patientDialog")
    .close();
}


// CLOSE RESCHEDULE DIALOG
function closeRescheduleDialog() {

  document
    .getElementById("rescheduleDialog")
    .close();
}


// ADD WALK-IN PATIENT
async function submitPatient() {

  const first_name =
    document.getElementById("firstName")
      .value;

  const last_name =
    document.getElementById("lastName")
      .value;

  const email =
    document.getElementById("email")
      .value;

  const phone_number =
    document.getElementById("phoneNumber")
      .value;

  const clinic_id =
    getCurrentUser().clinicId;

  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone_number
  ) {

    alert("Please fill in all fields");
    return;
  }

  if (!clinic_id) {

    alert(
      "No clinic is linked to this staff account."
    );

    return;
  }

  try {

    const response = await fetch(
      "/api/queue/add-walkin",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
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

    document
      .getElementById("patientDialog")
      .close();

    await loadPatients();

  } catch (error) {

    console.error(error);

    alert("Error adding patient");
  }
}



// SUBMIT RESCHEDULE
async function submitReschedule() {

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

    if (!appointmentId) {

      alert("Please select a patient");

      return;
    }

    if (!appointment_date) {

      alert("Please select a new date");

      return;
    }

    if (!appointment_time) {

      alert("Please select a time");

      return;
    }

    console.log("PATCHING APPOINTMENT:", {
      appointmentId,
      appointment_date,
      appointment_time
    });

    const response = await fetch(
      `/api/queue/appointments/${appointmentId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          appointment_date,
          appointment_time
        })
      }
    );

    const data =
      await response.json();

    console.log(
      "PATCH RESPONSE:",
      data
    );

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Failed to reschedule"
      );
    }

    alert(
      "Appointment rescheduled successfully"
    );

    closeRescheduleDialog();

    // REFRESH DATA
    await loadPatients();

  } catch (error) {

    console.error(
      "RESCHEDULE ERROR:",
      error
    );

    alert(
      "Error rescheduling appointment"
    );
  }
}


// INITIAL LOAD
loadDashboardClinicName();
loadPatients();


// GLOBAL FUNCTIONS
window.submitPatient = submitPatient;
window.closeDialog = closeDialog;

window.submitReschedule =
  submitReschedule;

window.closeRescheduleDialog =
  closeRescheduleDialog;