import { requireAuth, getCurrentUser } from "./auth.js";

// Access control
requireAuth();

// Clears display before loading new queue data
async function loadQueue() {
  const loading = document.getElementById("loading");
  const empty = document.getElementById("empty");
  const queueDetails = document.getElementById("queue-details");
  const summaryText = document.getElementById("summary-text");

  queueDetails.innerHTML = "";

  empty.style.display = "none";
  queueDetails.style.display = "none";

  try {
    const token = sessionStorage.getItem("firebaseToken");

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

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.error || "Server error");
    }

    const queue = await res.json();

    loading.style.display = "none";

    if (!queue) {
      empty.style.display = "block";
      summaryText.innerText = "You are not currently in a queue";
      return;
    }

    const clinicName = queue.clinic_name || "Clinic";
    const queuePosition = Number(queue.queue_position);
    const status = queue.status || "waiting";

    // Checks if check_in_time exists
    const checkInTime = queue.check_in_time
      ? new Date(queue.check_in_time)
      : null;

    const estimatedWaitTime = formatWaitTime(queue.estimated_wait_minutes);

    summaryText.innerText =
      `You are number ${queuePosition} in the queue at ${clinicName}`;

    queueDetails.innerHTML = `
      <article class="queue-card">

        <section class="queue-main">

          <section>
            <p class="queue-label">Clinic</p>
            <h2 class="queue-title">${clinicName}</h2>
          </section>

          <span class="status ${status}">
            ${formatStatus(status)}
          </span>

        </section>

        <section class="queue-position-box">
          <p class="position-number">${queuePosition}</p>
          <p class="position-text">Your queue position</p>
        </section>

        <section class="queue-grid">

          <article class="queue-info-box">
            <p class="queue-label">Estimated wait time</p>
            <p class="queue-value">${estimatedWaitTime}</p>
          </article>

          <article class="queue-info-box">
            <p class="queue-label">Check-in time</p>
            <p class="queue-value">
              ${checkInTime ? formatTime(checkInTime) : "Not available"}
            </p>
          </article>

          <article class="queue-info-box">
            <p class="queue-label">Status</p>
            <p class="queue-value">${formatStatus(status)}</p>
          </article>

          <article class="queue-info-box">
            <p class="queue-label">People waiting at clinic</p>
            <p class="queue-value">
              ${queue.people_waiting_at_clinic || 0}
            </p>
          </article>

        </section>

      </article>
    `;

    queueDetails.style.display = "block";

  } catch (err) {
    console.error(err);
    loading.innerText = "Failed to load your queue position";
    summaryText.innerText = "You are currently not in the queue";
  }
}

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