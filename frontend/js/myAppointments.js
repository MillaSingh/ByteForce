async function findAppointments() {
  const phone = document.getElementById("phone").value.trim();
  const error = document.getElementById("lookup-error");

  if (!phone) {
    error.innerText = "Please enter your phone number";
    return;
  }

  try {
    const res = await fetch(`/api/appointments/by-phone?phone=${phone}`);

    if (!res.ok) throw new Error("Error fetching");

    const data = await res.json();

    if (!data || data.length === 0) {
      error.innerText = "No appointments found for this number";
      return;
    }

    // Hide form, show dashboard
    document.getElementById("lookup-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    loadAppointmentsByData(data);

  } catch (err) {
    console.error(err);
    error.innerText = "Something went wrong";
  }
}


function loadAppointmentsByData(data) {
  const upcoming = document.getElementById("upcoming");
  const past = document.getElementById("past");
  const loading = document.getElementById("loading");
  const empty = document.getElementById("empty");

  upcoming.innerHTML = "";
  past.innerHTML = "";

  loading.style.display = "none";

  if (!data.length) {
    empty.style.display = "block";
    return;
  }

  const now = new Date();
  now.setSeconds(0, 0);

  let upcomingCount = 0;

  data.forEach(app => {

    try {
      // ✅ FIXED DATE HANDLING (WORKS WITH YOUR DB FORMAT)

      // Convert DB date safely (handles string OR Date object)
      const rawDate = new Date(app.appointment_date);

      const year = rawDate.getFullYear();
      const month = rawDate.getMonth(); // 0-based
      const day = rawDate.getDate();

      // Remove microseconds from time
      const timeParts = app.appointment_time.split(".")[0].split(":");

      const hour = parseInt(timeParts[0], 10);
      const minute = parseInt(timeParts[1], 10);

      // Final valid JS Date
      const dateTime = new Date(year, month, day, hour, minute);

      if (isNaN(dateTime.getTime())) {
        console.error("Invalid date:", app);
        return; // skip only broken record (not all)
      }

      const status = app.status || "pending";

      const isUpcoming =
        dateTime.getTime() >= now.getTime() &&
        status !== "cancelled";

      const card = document.createElement("div");
      card.className = "appointment-card";
      card.dataset.type = isUpcoming ? "upcoming" : "past";

      card.innerHTML = `
        <div class="appointment-info">
          <div class="appointment-title">${app.clinic_name || "Clinic"}</div>
          <div class="appointment-date">
            ${dateTime.toLocaleDateString()} • 
            ${dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <div>
          <span class="status ${status}">${status}</span>

          ${
            isUpcoming
              ? `<button class="cancel-btn" data-id="${app.appointment_id}">
                  Cancel
                </button>`
              : ""
          }
        </div>
      `;

      // CANCEL BUTTON
      const cancelBtn = card.querySelector(".cancel-btn");

      if (cancelBtn) {
        cancelBtn.addEventListener("click", async (e) => {
          e.stopPropagation();

          if (!confirm("Cancel this appointment?")) return;

          try {
            const res = await fetch(`/api/appointments/${app.appointment_id}`, {
              method: "DELETE"
            });

            if (!res.ok) throw new Error("Cancel failed");

            alert("Appointment cancelled");

            // Reload data
            findAppointments();

          } catch (err) {
            console.error(err);
            alert("Error cancelling appointment");
          }
        });
      }

      // APPEND TO CORRECT SECTION
      if (isUpcoming) {
        upcoming.appendChild(card);
        upcomingCount++;
      } else {
        past.appendChild(card);
      }

    } catch (err) {
      console.error("Error processing appointment:", err, app);
    }

  });

  document.getElementById("summary-text").innerText =
    `You have ${upcomingCount} upcoming appointment(s)`;
}


// FILTER FUNCTION
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