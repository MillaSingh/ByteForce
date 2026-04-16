
// GLOBAL VARIABLE


// This will store data coming from the backend
let patients = [];


// LOAD DATA FROM BACKEND (FETCH)


async function loadPatients() {
  try {
    // Call your backend API
    const response = await fetch('/api/patients');

    // Convert response to JSON
    patients = await response.json();

    // Display data in table
    renderPatients();

  } catch (error) {
    console.error("Error fetching patients:", error);
  }
}



// DISPLAY DATA IN TABLE


function renderPatients() {
  const table = document.getElementById("patientTable");
  table.innerHTML = ""; // clear table before re-rendering

  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterStatus").value;

  patients.forEach((patient) => {

    // Combine first + last name
    const fullName = patient.first_name + " " + patient.last_name;

    // Apply search + filter conditions
    if (
      fullName.toLowerCase().includes(search) &&
      (filter === "All" || formatStatus(patient.status) === filter)
    ) {

      // Create table row
      let row = `
        <tr>
          <td>${patient.queue_position}</td>
          <td>${fullName}</td>
          <td>${patient.queue_id}</td>
          <td>
            <select onchange="updateStatus(${patient.queue_id}, this.value)">
              <option ${patient.status==="waiting"?"selected":""}>Waiting</option>
              <option ${patient.status==="in_consultation"?"selected":""}>In Consultation</option>
              <option ${patient.status==="complete"?"selected":""}>Complete</option>
            </select>
          </td>
        </tr>
      `;

      table.innerHTML += row;
    }
  });
}



// FORMAT STATUS (DB → UI)


function formatStatus(status) {
  if (status === "waiting") return "Waiting";
  if (status === "in_consultation") return "In Consultation";
  if (status === "complete") return "Complete";
}



// UPDATE STATUS IN DATABASE


async function updateStatus(id, value) {

  // Convert UI text → database format
  let dbStatus = value.toLowerCase().replace(" ", "_");

  try {
    await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: dbStatus })
    });

    // Reload updated data from database
    loadPatients();

  } catch (error) {
    console.error("Error updating status:", error);
  }
}



// EVENT LISTENERS


// Re-render table when user types
document.getElementById("searchInput")
  .addEventListener("input", renderPatients);

// Re-render table when filter changes
document.getElementById("filterStatus")
  .addEventListener("change", renderPatients);




// Load data when page opens
loadPatients();