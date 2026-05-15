// Load appointments automatically
window.addEventListener(
  "DOMContentLoaded",
  loadMyAppointments
);

// Fetch logged-in user's appointments
async function loadMyAppointments() {

  try {

    const res = await fetch(
      "/api/appointments/my",
      {
        credentials: "include"
      }
    );

    // Redirect if not logged in
    if (res.status === 401) {

      window.location.href =
        "/html/login.html";

      return;
    }

    if (!res.ok) {

      throw new Error(
        "Failed to load appointments"
      );
    }

    const data = await res.json();

    // Show dashboard
    document.getElementById(
      "dashboard"
    ).style.display = "block";

    // Load appointments
    loadAppointmentsByData(data);

  } catch (err) {

    console.error(err);

    alert(
      "Failed to load appointments"
    );
  }
}


// Loads appointments into dashboard
function loadAppointmentsByData(data) {

  const upcoming =
    document.getElementById("upcoming");

  const past =
    document.getElementById("past");

  const loading =
    document.getElementById("loading");

  const empty =
    document.getElementById("empty");

  upcoming.innerHTML = "";
  past.innerHTML = "";

  loading.style.display = "none";
  empty.style.display = "none";

  if (!data.length) {

    empty.style.display = "block";

    return;
  }

  const now = new Date();

  now.setSeconds(0, 0);

  let upcomingCount = 0;

  data.forEach(app => {

    try {

      const rawDate =
        new Date(app.appointment_date);

      const year =
        rawDate.getFullYear();

      const month =
        rawDate.getMonth();

      const day =
        rawDate.getDate();

      const timeParts =
        app.appointment_time
          .split(".")[0]
          .split(":");

      const hour =
        parseInt(timeParts[0], 10);

      const minute =
        parseInt(timeParts[1], 10);

      const dateTime =
        new Date(
          year,
          month,
          day,
          hour,
          minute
        );

      if (isNaN(dateTime.getTime())) {

        console.error(
          "Invalid date:",
          app
        );

        return;
      }

      let status =
        (app.status || "")
          .toLowerCase();

      const isUpcoming =
        dateTime.getTime() >=
        now.getTime() &&
        status !== "cancelled";

      if (
        !isUpcoming &&
        status !== "cancelled"
      ) {

        status = "completed";
      }

      const card =
        document.createElement("div");

      card.className =
        "appointment-card";

      card.dataset.type =
        isUpcoming
          ? "upcoming"
          : "past";

      card.innerHTML = `

        <div class="appointment-info">

          <div class="appointment-title">
            ${app.clinic_name || "Clinic"}
          </div>

          <div class="appointment-date">
            ${dateTime.toLocaleDateString()}
            •

            ${dateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>

        </div>

        <div>

          ${
            status === "cancelled"

              ? `
                <span class="status cancelled">
                  Cancelled
                </span>
              `

              : status === "completed"

              ? `
                <span class="status completed">
                  Completed
                </span>
              `

              : ""
          }

          ${
            isUpcoming

              ? `
                <button
                  class="reschedule-btn"
                  data-id="${app.appointment_id || app.appointmentId}"
                  data-clinic="${app.clinic_id}">
                  Reschedule
                </button>

                <button
                  class="cancel-btn"
                  data-id="${app.appointment_id || app.appointmentId}"
                  Cancel
                </button>

                <button
                class="checkin-btn"
                data-id="${app.appointment_id || app.appointmentId}"
                Check In
              </button>
              `

              : ""
          }

        </div>
      `;

      const cancelBtn =
        card.querySelector(".cancel-btn");

      if (cancelBtn) {

        cancelBtn.addEventListener(
          "click",
          async () => {

            const confirmCancel =
              confirm(
                "Cancel this appointment?"
              );

            if (!confirmCancel) return;

            try {

              const res =
                await fetch(
                  `/api/appointments/${app.appointment_id}`,
                  {
                    method: "DELETE",
                    credentials: "include"
                  }
                );

              if (!res.ok) {

                throw new Error(
                  "Cancel failed"
                );
              }

              alert(
                "Appointment cancelled"
              );

              loadMyAppointments();

            } catch (err) {

              console.error(err);

              alert(
                "Error cancelling appointment"
              );
            }
          }
        );
      }

      const rescheduleBtn =
        card.querySelector(
          ".reschedule-btn"
        );

      if (rescheduleBtn) {

        rescheduleBtn.addEventListener(
          "click",
          async () => {

            const newDate =
              prompt(
                "Enter new date (YYYY-MM-DD)"
              );

            if (!newDate) return;

            const newTime =
              prompt(
                "Enter new time (HH:MM)"
              );

            if (!newTime) return;

            try {

              const res =
                await fetch(
                  `/api/appointments/${app.appointment_id}/reschedule`,
                  {
                    method: "PUT",

                    headers: {
                      "Content-Type":
                        "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                      clinic_id:
                        app.clinic_id,

                      appointment_date:
                        newDate,

                      appointment_time:
                        newTime
                    })
                  }
                );

              const responseData =
                await res.json();

              if (!res.ok) {

                throw new Error(
                  responseData.error
                );
              }

              alert(
                "Appointment rescheduled"
              );

              loadMyAppointments();

            } catch (err) {

              console.error(err);

              alert(err.message);
            }
          }
        );
      }

      const checkInBtn =
  card.querySelector(".checkin-btn");

if (checkInBtn) {

  checkInBtn.addEventListener(
    "click",
    async () => {

      const appointmentId =
        app.appointment_id || app.appointmentId;

      if (!appointmentId) {

        console.error("Missing appointment ID", app);

        alert("Appointment ID missing");

        return;
      }

      try {

        const res = await fetch(
          `/api/queue/checkin/${appointmentId}`,
          {
            method: "POST",
            credentials: "include"
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error);
        }

        alert("Checked in successfully!");

        loadMyAppointments();

      } catch (err) {

        console.error(err);
        alert(err.message);
      }
    }
  );
}

      if (isUpcoming) {

        upcoming.appendChild(card);

        upcomingCount++;

      } else {

        past.appendChild(card);
      }

    } catch (err) {

      console.error(err);
    }
  });

  document.getElementById(
    "summary-text"
  ).innerText =
    `You have ${upcomingCount} upcoming appointment(s)`;
}


// Filters appointments
function filterAppointments(type) {

  document
    .querySelectorAll(".appointment-card")
    .forEach(card => {

      if (type === "all") {

        card.style.display = "flex";

      } else {

        card.style.display =
          card.dataset.type === type
            ? "flex"
            : "none";
      }
    });
}
