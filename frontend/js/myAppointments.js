async function loadAppointments() {
  const upcoming = document.getElementById("upcoming");
  const past = document.getElementById("past");
  const loading = document.getElementById("loading");
  const empty = document.getElementById("empty");

  if (upcoming) upcoming.innerHTML = "";
  if (past) past.innerHTML = "";

  try {
    const patientId =
      new URLSearchParams(window.location.search).get("patientId");

    if (!patientId) {
      throw new Error("Missing patientId in URL");
    }

    const res = await fetch(`/api/appointments/my?patientId=${patientId}`);

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    if (loading) loading.style.display = "none";

    if (!Array.isArray(data) || data.length === 0) {
      if (empty) empty.style.display = "block";
      return;
    }

    const now = new Date();
    let upcomingCount = 0;

    data.forEach(app => {
      if (!app.appointment_date || !app.appointment_time) return;

      const dateTime = new Date(
        `${app.appointment_date}T${app.appointment_time}`
      );

      const status = app.status || "booked";
      const isUpcoming = dateTime >= now && status !== "cancelled";

      const card = document.createElement("div");
      card.className = "appointment-card";
      card.dataset.type = isUpcoming ? "upcoming" : "past";

      card.innerHTML = `
    <div>
    <div class="appointment-title">${app.clinic_name || "Clinic"}</div>
    <div class="appointment-date">
      ${dateTime.toLocaleDateString()} • 
      ${dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}
    </div>
    </div>

  <div class="status ${status}">
    ${status}
  </div>

  ${
    isUpcoming
      ? `<button class="cancel-btn" data-id="${app.appointment_id}">
           Cancel
         </button>`
      : ""
  }
`;

      card.onclick = () => {
        alert(
          `Clinic: ${app.clinic_name || "Clinic"}\n` +
          `Date: ${dateTime.toLocaleDateString()}\n` +
          `Time: ${dateTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}\n` +
          `Status: ${status}`
        );
      };

      const cancelBtn = card.querySelector(".cancel-btn");

if (cancelBtn) {
  cancelBtn.addEventListener("click", async (e) => {
    e.stopPropagation();

    const confirmCancel = confirm("Are you sure you want to cancel this appointment?");
    if (!confirmCancel) return;

    try {
      cancelBtn.disabled = true;

      const res = await fetch(`/api/appointments/${app.appointment_id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed");

      alert("Appointment cancelled");

      loadAppointments(); // refresh UI

    } catch (err) {
      console.error(err);
      alert("Error cancelling appointment");
      cancelBtn.disabled = false;
    }
  });
}

      if (isUpcoming) {
        upcoming?.appendChild(card);
        upcomingCount++;
      } else {
        past?.appendChild(card);
      }
    });

    const summaryText = document.getElementById("summary-text");
    if (summaryText) {
      summaryText.innerText = `You have ${upcomingCount} upcoming appointment(s)`;
    }

  } catch (err) {
    console.error(err);
    if (loading) loading.innerText = "Failed to load appointments ";
  }
}

function filterAppointments(type) {
  document.querySelectorAll(".appointment-card").forEach(card => {
    if (type === "all") {
      card.style.display = "flex";
    } else {
      card.style.display =
        card.dataset.type === type ? "flex" : "none";
    }
  });
}

loadAppointments();
