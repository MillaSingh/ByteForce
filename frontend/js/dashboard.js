import { requireRole, getCurrentUser } from '/js/auth.js';

requireRole(['staff']);

let patients = [];

/* ELEMENTS*/

const patientTable = document.getElementById("patientTable");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

const addPatientBtn = document.getElementById("addPatientBtn");
const rescheduleBtn = document.getElementById("rescheduleBtn");

const patientDialog = document.getElementById("patientDialog");
const rescheduleDialog = document.getElementById("rescheduleDialog");

const submitPatientBtn = document.getElementById("submitPatientBtn");
const closePatientDialogBtn = document.getElementById("closePatientDialogBtn");

const saveRescheduleBtn = document.getElementById("saveRescheduleBtn");
const closeRescheduleDialogBtn = document.getElementById("closeRescheduleDialogBtn");

const accountBtn = document.getElementById("accountBtn");

/* ACCOUNT BUTTON */

accountBtn.addEventListener("click", () => {

  sessionStorage.setItem(
    "previousPageBeforeAccount",
    window.location.pathname + window.location.search
  );

  window.location.href = "/html/account.html";
});

/* LOAD DASHBOARD TITLE*/

const loadDashboardClinicName = async () => {

  try {

    const currentUser = getCurrentUser();
    const clinicId = currentUser?.clinicId;

    if (!clinicId) {
      console.error("No clinicId found");
      return;
    }

    const response = await fetch(
      `/api/queue/clinics?clinic_id=${clinicId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch clinic");
    }

    const clinics = await response.json();

    const clinicName = clinics[0]?.clinic_name;

    const dashboardTitle =
      document.getElementById("dashboardTitle");

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

/* LOAD PATIENTS*/

const loadPatients = async () => {

  try {

    const currentUser = getCurrentUser();
    const clinicId = currentUser?.clinicId;

    if (!clinicId) {

      alert(
        "No clinic assigned to this staff profile."
      );

      return;
    }

    const response = await fetch(
      `/api/queue?clinic_id=${clinicId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }

    patients = await response.json();

    renderPatients();

  } catch (error) {

    console.error(
      "Error fetching patients:",
      error
    );
  }
};

/* FORMAT STATUS*/

const formatStatus = (status) => {

  const map = {
    waiting: "Waiting",
    in_consultation: "In Consultation",
    complete: "Complete"
  };

  return map[status] || "";
};

/*RENDER PATIENTS*/

const renderPatients = () => {

  const search =
    searchInput.value.toLowerCase();

  const filter =
    filterStatus.value;

  patientTable.innerHTML = "";

  const filteredPatients = patients.filter(
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

  filteredPatients.forEach((patient) => {

    const row = document.createElement("tr");

    const fullName =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim();

    row.innerHTML = `
      <td>${patient.queue_position || "-"}</td>

      <td>${fullName}</td>

      <td>${patient.email || "-"}</td>

      <td>${patient.phone_number || "-"}</td>

      <td>
        <select class="statusSelect" data-id="${patient.queue_id}">

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

    const statusSelect =
      row.querySelector(".statusSelect");

    statusSelect.addEventListener(
      "change",
      async (e) => {

        const id =
          e.target.dataset.id;

        const value =
          e.target.value;

        if (value === "Delete") {

          await deletePatient(id);

        } else {

          await updateStatus(id, value);
        }
      }
    );

    patientTable.appendChild(row);
  });
};

/* UPDATE STATUS*/

const updateStatus = async (id, value) => {

  try {

    const dbStatus =
      value.toLowerCase().replace(/\s+/g, "_");

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

/*DELETE PATIENT*/

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
      throw new Error("Failed to delete patient");
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

/*DIALOG CONTROLS*/

const closeDialog = () => {
  patientDialog.close();
};

const closeRescheduleDialog = () => {
  rescheduleDialog.close();
};

/* ADD PATIENT*/

const submitPatient = async () => {

  const first_name =
    document.getElementById("firstName").value.trim();

  const last_name =
    document.getElementById("lastName").value.trim();

  const email =
    document.getElementById("email").value.trim();

  const phone_number =
    document.getElementById("phoneNumber").value.trim();

  const clinic_id =
    getCurrentUser()?.clinicId;

  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone_number
  ) {

    alert("Please fill in all fields");
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
      throw new Error("Failed to add patient");
    }

    closeDialog();

    await loadPatients();

  } catch (error) {

    console.error(error);

    alert("Error adding patient");
  }
};

/* OPEN RESCHEDULE DIALOG*/

const openRescheduleDialog = () => {

  const dropdown =
    document.getElementById("appointmentSelect");

  dropdown.innerHTML = `
    <option value="">
      Select Patient
    </option>
  `;

  const waitingPatients = patients.filter(
    patient =>
      patient.status === "waiting" &&
      patient.appointment_id
  );

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

  rescheduleDialog.showModal();
};

/*SUBMIT RESCHEDULE*/

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

/*EVENT LISTENERS*/

searchInput.addEventListener(
  "input",
  renderPatients
);

filterStatus.addEventListener(
  "change",
  renderPatients
);

addPatientBtn.addEventListener(
  "click",
  () => {
    patientDialog.showModal();
  }
);

rescheduleBtn.addEventListener(
  "click",
  openRescheduleDialog
);

submitPatientBtn.addEventListener(
  "click",
  submitPatient
);

closePatientDialogBtn.addEventListener(
  "click",
  closeDialog
);

saveRescheduleBtn.addEventListener(
  "click",
  submitReschedule
);

closeRescheduleDialogBtn.addEventListener(
  "click",
  closeRescheduleDialog
);

/* INITIAL LOAD*/

loadDashboardClinicName();
loadPatients();