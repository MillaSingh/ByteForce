// GLOBAL VARIABLE
// Stores data from backend
let patients = [];


// LOAD DATA FROM BACKEND
const loadPatients = async () => {
  try {
    const response = await fetch('/api/queue');

    if (!response.ok) throw new Error("Failed to fetch data");

    patients = await response.json();
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
      const fullName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim();

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${patient.queue_position ?? "-"}</td>
        <td>${fullName}</td>
        <td>${patient.email ?? "-"}</td>
        <td>${patient.phone_number ?? "-"}</td>
        <td>
          <select data-id="${patient.queue_id}">
            <option value="Waiting" ${patient.status === "waiting" ? "selected" : ""}>Waiting</option>
            <option value="In Consultation" ${patient.status === "in_consultation" ? "selected" : ""}>In Consultation</option>
            <option value="Complete" ${patient.status === "complete" ? "selected" : ""}>Complete</option>
            <option value="Delete">Delete</option>
          </select>
        </td>
        <td>${patient.clinic_name ?? "-"} 
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
  const dbStatus = value.toLowerCase().replace(/\s+/g, "_");

  try {
    const response = await fetch(`/api/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: dbStatus })
    });

    if (!response.ok) throw new Error("Failed to update status");

    await loadPatients();

  } catch (error) {
    console.error("Error updating status:", error);
  }
};


// DELETE PATIENT FROM QUEUE
const deletePatient = async (id) => {
  const confirmDelete = confirm("Are you sure you want to remove this patient from the queue?");

  if (!confirmDelete) {
    await loadPatients();
    return;
  }

  try {
    const response = await fetch(`/api/queue/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Failed to delete patient");

    await loadPatients();

  } catch (error) {
    console.error("Error deleting patient:", error);
    alert("Error deleting patient");
    await loadPatients();
  }
};

// EVENT LISTENERS
document.getElementById("searchInput").addEventListener("input", renderPatients);
document.getElementById("filterStatus").addEventListener("change", renderPatients);


// INITIAL LOAD
loadPatients();
// LOAD CLINICS FROM BACKEND
const loadClinics = async () => {
  const clinicSelect = document.getElementById("clinicSelect");

  try {
    const response = await fetch("/api/queue/clinics");

    if (!response.ok) throw new Error("Failed to fetch clinics");

    const clinics = await response.json();

    clinicSelect.innerHTML = `<option value="">Select clinic</option>`;

    clinics.forEach((clinic) => {
      const option = document.createElement("option");
      option.value = clinic.clinic_id;
      option.textContent = clinic.clinic_name;
      clinicSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error loading clinics:", error);
  }
};

// ADD PATIENT FUNCTIONALITY

// When the "Add Patient" button is clicked, open the dialog (popup form)
document.getElementById("addPatientBtn").addEventListener("click", () => {
  loadClinics();
  document.getElementById("patientDialog").showModal();
});
// Function to close the dialog manually
function closeDialog() {
  document.getElementById("patientDialog").close();
}

// Function to submit a new patient
async function submitPatient() {

  // Get values entered by the user from input fields
  const first_name = document.getElementById("firstName").value;
  const last_name = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const phone_number = document.getElementById("phoneNumber").value;
  const clinic_id = document.getElementById("clinicSelect").value;

  // Check if any field is empty
  if (!first_name || !last_name || !email || !phone_number || !clinic_id) {
    alert("Please fill in all fields and select a clinic");
    return;
  }

  try {
    // Send patient data to backend using POST request
    const response = await fetch("/api/queue/add-walkin", {
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
    });

    // If request fails, throw an error
    if (!response.ok) throw new Error("Failed to add patient");

    // Close the dialog after successful submission
    document.getElementById("patientDialog").close();

    // Reload/update the patient list
    loadPatients();

  } catch (error) {
    // Log error in console for debugging
    console.error(error);

    // Show error message to user
    alert("Error adding patient");
  }
}