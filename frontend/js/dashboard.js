
import { requireRole, getCurrentUser } from '/js/auth.js';
requireRole(['staff']);

// GLOBAL VARIABLE
// Stores data from backend
let patients = [];

// const loadDashboardClinicName = async () => {
//   try {
//     const currentUser = getCurrentUser();
//     const clinicId = currentUser.clinicId;

//     if (!clinicId) return;

//     const response = await fetch(`/api/queue/clinics?clinic_id=${clinicId}`);

//     if (!response.ok) {
//       throw new Error("Failed to fetch clinic");
//     }

//     const clinics = await response.json();

//     const clinicName = clinics[0]?.clinic_name;

//     if (clinicName) {
//       document.getElementById("dashboardTitle").textContent =
//         `Patient Queue Dashboard - ${clinicName}`;
//     }

//   } catch (error) {
//     console.error("Error loading dashboard clinic name:", error);
//   }
// };



<<<<<<< HEAD
=======
//     if (!response.ok) throw new Error("Failed to fetch data");

//     patients = await response.json();
//     renderPatients();

//   } catch (error) {
//     console.error("Error fetching patients:", error);
//   }
// };
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

    const response = await fetch(`/api/queue/clinics?clinic_id=${clinicId}`);

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
    }
    else {
      console.error("No clinic name returned");
    }

  } catch (error) {
    console.error("Error loading dashboard clinic name:", error);
  }
};
>>>>>>> 69413b4ea5d9bf692c898c48d8fe47545a86c7db

const loadPatients = async () => {
  try {
    const currentUser = getCurrentUser();
    const clinicId = currentUser.clinicId;

    console.log("CURRENT USER:", currentUser);
    console.log("DASHBOARD CLINIC ID:", clinicId);

    if (!clinicId) {
      console.error("No clinicId found for this staff user");
      alert("No clinic assigned to this staff profile.");
      return;
    }

    const response = await fetch(`/api/queue?clinic_id=${clinicId}`);

    console.log("QUEUE RESPONSE STATUS:", response.status);

    if (!response.ok) throw new Error("Failed to fetch data");

    patients = await response.json();

    console.log("PATIENTS RETURNED:", patients);

    renderPatients();

  } catch (error) {
    console.error("Error fetching patients:", error);
  }
};


// FORMAT STATUS (DB → UI)
const formatStatus = (status) => {
  const map = {
    waiting: "Waiting",
    in_consultation: "In Consultation",
    complete: "Complete"
  };
  return map[status] ?? "";
};


// DISPLAY DATA IN TABLE
const renderPatients = () => {
  const table = document.getElementById("patientTable");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterStatus").value;

  table.innerHTML = "";

  patients
    .filter(({ first_name = "", last_name = "", status }) => {
      const fullName = `${first_name} ${last_name}`.toLowerCase();

      return (
        fullName.includes(search) &&
        (filter === "All" || formatStatus(status) === filter)
      );
    })
    .forEach((patient) => {

      const fullName =
        `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();

      const row = document.createElement("tr");

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

      row.querySelector("select").addEventListener("change", (e) => {

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


// UPDATE STATUS IN DATABASE
const updateStatus = async (id, value) => {

  const dbStatus =
    value.toLowerCase().replace(/\s+/g, "_");

  try {

    const response = await fetch(`/api/queue/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: dbStatus
      })
    });

    if (!response.ok)
      throw new Error("Failed to update status");

    await loadPatients();

  } catch (error) {

    console.error("Error updating status:", error);
  }
};


// DELETE PATIENT FROM QUEUE
const deletePatient = async (id) => {

  const confirmDelete = confirm(
    "Are you sure you want to remove this patient from the queue?"
  );

  if (!confirmDelete) {

    await loadPatients();
    return;
  }

  try {

    const response = await fetch(`/api/queue/${id}`, {
      method: "DELETE"
    });

    if (!response.ok)
      throw new Error("Failed to delete patient");

    await loadPatients();

  } catch (error) {

    console.error("Error deleting patient:", error);

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

// ADD PATIENT FUNCTIONALITY

// When the "Add Patient" button is clicked,
// open the dialog (popup form)
document
  .getElementById("addPatientBtn")
  .addEventListener("click", () => {

    document
      .getElementById("patientDialog")
      .showModal();
  });


// Function to close the dialog manually
function closeDialog() {

  document
    .getElementById("patientDialog")
    .close();
}


// Function to submit a new patient
async function submitPatient() {

  const first_name =
    document.getElementById("firstName").value;

  const last_name =
    document.getElementById("lastName").value;

  const email =
    document.getElementById("email").value;

  const phone_number =
    document.getElementById("phoneNumber").value;

  const clinic_id = getCurrentUser().clinicId;

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
    alert("No clinic is linked to this staff account.");
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

    if (!response.ok)
      throw new Error("Failed to add patient");

    document
      .getElementById("patientDialog")
      .close();

  } catch (error) {

    console.error(error);

    alert("Error adding patient");
  }
}
// INITIAL LOAD
loadDashboardClinicName();
loadPatients();

// MAKE FUNCTIONS GLOBAL

window.submitPatient = submitPatient;
window.closeDialog = closeDialog;