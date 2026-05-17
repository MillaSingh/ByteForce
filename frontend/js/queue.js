import { requireAuth, getCurrentUser } from "./auth.js";
emailjs.init("It5nWm42g6-DChkm5");
if (!sessionStorage.getItem("callSoonEmailSent")) {
  sessionStorage.setItem("callSoonEmailSent", "false");
}
// Makes sure only logged-in users can access this page
requireAuth();

async function loadQueue() {
  const loading = document.getElementById("loading");
  const empty = document.getElementById("empty");
  const queueDetails = document.getElementById("queue-details");
  const summaryText = document.getElementById("summary-text");

  // Clears anything that was displayed before loading new queue data
  queueDetails.innerHTML = "";

  empty.style.display = "none";
  queueDetails.style.display = "none";

  try {
    const token = sessionStorage.getItem("firebaseToken");

    // If there is no token, the user should not stay on this page
    if (!token) {
      window.location.replace("/html/Login.html");
      return;
    }

    const user = getCurrentUser();

// Sends the current user's email to the server to find their queue
    const res = await fetch("/api/patient-queue/my", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      // Allows cookies/session information to be sent with the request
      credentials: "include",
      body: JSON.stringify({
        email: user.email,
      }),
    });

// Stops the code if the server sends back an error response
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.error || "Server error");
    }

    const queue = await res.json();

    loading.style.display = "none";

    // Shows a message if the user is not currently in any queue
    if (!queue) {
      empty.style.display = "block";
      summaryText.innerText = "You are not currently in a queue";
      return;
    }

// Stores queue values in variables so they are easier to use below
    const clinicName = queue.clinic_name || "Clinic";
    const queuePosition = Number(queue.queue_position);
    const status = queue.status || "waiting";
//operator checks if check_in_time exists
    const checkInTime = queue.check_in_time
      ? new Date(queue.check_in_time)
      : null;

      const estimatedWaitTime = formatWaitTime(queue.estimated_wait_minutes);

    summaryText.innerText =
      `You are number ${queuePosition} in the queue at ${clinicName}`;

    // Builds the queue card that will be shown on the page
    queueDetails.innerHTML = `
      <div class="queue-card">

        <div class="queue-main">
          <div>
            <div class="queue-label">Clinic</div>
            <div class="queue-title">${clinicName}</div>
          </div>

          <div class="status ${status}">
            ${formatStatus(status)}
          </div>
        </div>

        <div class="queue-position-box">
          <div class="position-number">${queuePosition}</div>
          <div class="position-text">Your queue position</div>
        </div>

        <div class="queue-grid">
          <div class="queue-info-box">
            <div class="queue-label">Estimated wait time</div>
            <div class="queue-value">${estimatedWaitTime}</div>
          </div>

          <div class="queue-info-box">
            <div class="queue-label">Check-in time</div>
            <div class="queue-value">
              ${checkInTime ? formatTime(checkInTime) : "Not available"}
            </div>
          </div>

          <div class="queue-info-box">
            <div class="queue-label">Status</div>
            <div class="queue-value">${formatStatus(status)}</div>
          </div>

          <div class="queue-info-box">
            <div class="queue-label">People waiting at clinic</div>
            <div class="queue-value">
              ${queue.people_waiting_at_clinic || 0}
            </div>
          </div>
        </div>

      </div>
    `;

    queueDetails.style.display = "block";

  } catch (err) {
    console.error(err);
    loading.innerText = "Failed to load your queue position";
    summaryText.innerText = "You are currently not in the queue";
  }

  const waitMinutes = queue.estimated_wait_minutes;

// read memory
const alreadySent = sessionStorage.getItem("callSoonEmailSent") === "true";

if (waitMinutes <= 0 && !alreadySent) {

  sessionStorage.setItem("callSoonEmailSent", "true");

  emailjs.send(
    "service_5cctkza",
    "template_ink02da",
    {
      email: user.email,
      patient_name: user.email,
      clinic_name: clinicName,
      appointment_date: new Date().toISOString().split("T")[0],
      appointment_time: "Soon",
      reason: "You should be called soon"
    }
  )
  .then(() => console.log("Call soon email sent"))
  .catch(err => console.error(err));
}
}

// Changes wait time from minutes into a more readable message
function formatWaitTime(minutes) {
  if (minutes === null || minutes === undefined) {
    return "Not available";
  }

  if (minutes <= 0) {
    return "You should be called soon";
  }

  if (minutes < 60) {
    return `${minutes} minute(s)`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour(s)`;
  }

  return `${hours} hour(s) ${remainingMinutes} minute(s)`;
}

// Formats the check-in time so only the hour and minutes show
function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Makes the status text easier to read by removing underscores
function formatStatus(status) {
  return status.replace("_", " ");
}

// Runs the function when the page loads
loadQueue();
