import { requireAuth, getCurrentUser } from "./auth.js";

requireAuth();

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

const res = await fetch("/api/patient-queue/my", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
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

    const checkInTime = queue.check_in_time
      ? new Date(queue.check_in_time)
      : null;

    const estimatedWaitTime = formatWaitTime(queue.estimated_wait_minutes);

    summaryText.innerText =
      `You are number ${queuePosition} in the queue at ${clinicName}`;

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

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatStatus(status) {
  return status.replace("_", " ");
}

loadQueue();