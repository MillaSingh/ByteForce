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
          </select>
        </td>
        <td>
          
        </td>
`       ;

      row.querySelector("select").addEventListener("change", (e) => {
        updateStatus(e.target.dataset.id, e.target.value);
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



// EVENT LISTENERS
document.getElementById("searchInput").addEventListener("input", renderPatients);
document.getElementById("filterStatus").addEventListener("change", renderPatients);


// INITIAL LOAD
loadPatients();

// ADD PATIENT FUNCTIONALITY

// When the "Add Patient" button is clicked, open the dialog (popup form)
document.getElementById("addPatientBtn").addEventListener("click", () => {
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

  // Check if any field is empty
  if (!first_name || !last_name || !email) {
    alert("Please fill in all fields"); // Show warning
    return; // Stop function if validation fails
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
        clinic_id: 1 // Hardcoded clinic ID
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