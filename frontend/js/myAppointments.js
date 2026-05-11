// Finds appointments using phone number
async function findAppointments() {

  // Get phone input
  const phone = document.getElementById("phone").value.trim();

  // Get error message element
  const error = document.getElementById("lookup-error");

  // Get logged in user email
  const userEmail = sessionStorage.getItem("userEmail");

  // Redirect if user is not logged in
  if (!userEmail) {

    window.location.href = "/html/login.html";

    return;
  }

  // Show error if phone number is empty
  if (!phone) {

    error.innerText = "Please enter your phone number";

    return;
  }

  // Clear old error messages
  error.innerText = "";

  try {

    // Fetch appointments from backend
    const res =
      await fetch(`/api/appointments/by-phone?phone=${phone}`);

    // Check if request failed
    if (!res.ok) {

      throw new Error("Error fetching appointments");
    }

    // Convert response to JSON
    const data = await res.json();

    // Show message if no appointments exist
    if (!data || data.length === 0) {

      error.innerText =
        "No appointments found for this number";

      return;
    }

    // Hide lookup form
    document.getElementById("lookup-section").style.display = "none";

    // Show dashboard
    document.getElementById("dashboard").style.display = "block";

    // Load appointments onto page
    loadAppointmentsByData(data);

  } catch (err) {

    // Show error in console
    console.error(err);

    // Show error message on page
    error.innerText = "Something went wrong";
  }
}


// Loads appointments into dashboard
function loadAppointmentsByData(data) {

  // Get dashboard sections
  const upcoming = document.getElementById("upcoming");
  const past = document.getElementById("past");
  const loading = document.getElementById("loading");
  const empty = document.getElementById("empty");

  // Clear old appointments
  upcoming.innerHTML = "";
  past.innerHTML = "";

  // Hide loading and empty messages
  loading.style.display = "none";
  empty.style.display = "none";

  // Show empty message if no appointments exist
  if (!data.length) {

    empty.style.display = "block";

    return;
  }

  // Get current date and time
  const now = new Date();

  // Remove seconds and milliseconds
  now.setSeconds(0, 0);

  // Count upcoming appointments
  let upcomingCount = 0;

  // Loop through all appointments
  data.forEach(app => {

    try {

      // Convert appointment date
      const rawDate = new Date(app.appointment_date);

      // Extract year, month and day
      const year = rawDate.getFullYear();
      const month = rawDate.getMonth();
      const day = rawDate.getDate();

      // Split time into parts
      const timeParts =
        app.appointment_time
          .split(".")[0]
          .split(":");

      // Get hour and minute
      const hour = parseInt(timeParts[0], 10);
      const minute = parseInt(timeParts[1], 10);

      // Create full appointment date and time
      const dateTime =
        new Date(year, month, day, hour, minute);

      // Skip invalid dates
      if (isNaN(dateTime.getTime())) {

        console.error("Invalid date:", app);

        return;
      }

      // Get appointment status
      let status =
        (app.status || "").toLowerCase();

      // Check if appointment is upcoming
      const isUpcoming =
        dateTime.getTime() >= now.getTime() &&
        status !== "cancelled";

      // Change past appointments to completed
      if (!isUpcoming && status !== "cancelled") {

        status = "completed";
      }

      // Create appointment card
      const card = document.createElement("div");

      // Add card class
      card.className = "appointment-card";

      // Add card type for filtering
      card.dataset.type =
        isUpcoming ? "upcoming" : "past";

      // Add card HTML
      card.innerHTML = `

        <div class="appointment-info">

          <!-- Clinic name -->
          <div class="appointment-title">
            ${app.clinic_name || "Clinic"}
          </div>

          <!-- Appointment date and time -->
          <div class="appointment-date">
            ${dateTime.toLocaleDateString()} •

            ${dateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>

        </div>

        <div>

          ${
            status === "cancelled"

              // Cancelled badge
              ? `
                <span class="status cancelled">
                  Cancelled
                </span>
              `

              : status === "completed"

              // Completed badge
              ? `
                <span class="status completed">
                  Completed
                </span>
              `

              : ""
          }

          ${
            isUpcoming

              // Upcoming appointment buttons
              ? `
                <button
                  class="reschedule-btn"
                  data-id="${app.appointment_id}"
                  data-clinic="${app.clinic_id}">
                  Reschedule
                </button>

                <button
                  class="cancel-btn"
                  data-id="${app.appointment_id}">
                  Cancel
                </button>
              `

              : ""
          }

        </div>
      `;

      // Get cancel button
      const cancelBtn =
        card.querySelector(".cancel-btn");

      // Add cancel event
      if (cancelBtn) {

        cancelBtn.addEventListener(
          "click",
          async (e) => {

            // Prevent card click
            e.stopPropagation();

            // Ask user for confirmation
            const confirmCancel =
              confirm("Cancel this appointment?");

            // Stop if user clicks cancel
            if (!confirmCancel) {

              return;
            }

            try {

              // Send delete request
              const res = await fetch(
                `/api/appointments/${app.appointment_id}`,
                {
                  method: "DELETE"
                }
              );

              // Check if delete failed
              if (!res.ok) {

                throw new Error("Cancel failed");
              }

              // Show success message
              alert("Appointment cancelled");

              // Reload appointments
              findAppointments();

            } catch (err) {

              // Show error in console
              console.error(err);

              // Show error alert
              alert(
                "Error cancelling appointment"
              );
            }
          }
        );
      }

      // Get reschedule button
      const rescheduleBtn =
        card.querySelector(".reschedule-btn");

      // Add reschedule event
      if (rescheduleBtn) {

        rescheduleBtn.addEventListener(
          "click",
          async (e) => {

            // Prevent card click
            e.stopPropagation();

            // Ask for new date
            const newDate =
              prompt(
                "Enter new date (YYYY-MM-DD)"
              );

            // Stop if no date entered
            if (!newDate) return;

            // Ask for new time
            const newTime =
              prompt(
                "Enter new time (HH:MM)"
              );

            // Stop if no time entered
            if (!newTime) return;

            try {

              // Send update request
              const res = await fetch(
                `/api/appointments/${app.appointment_id}/reschedule`,
                {
                  method: "PUT",

                  headers: {
                    "Content-Type":
                      "application/json"
                  },

                  // Send new appointment data
                  body: JSON.stringify({
                    clinic_id: app.clinic_id,
                    appointment_date: newDate,
                    appointment_time: newTime
                  })
                }
              );

              // Convert response to JSON
              const responseData =
                await res.json();

              // Check if update failed
              if (!res.ok) {

                throw new Error(
                  responseData.error ||
                  "Failed to reschedule"
                );
              }

              // Show success message
              alert(
                "Appointment rescheduled"
              );

              // Reload appointments
              findAppointments();

            } catch (err) {

              // Show error in console
              console.error(err);

              // Show error alert
              alert(err.message);
            }
          }
        );
      }

      // Add card to correct section
      if (isUpcoming) {

        upcoming.appendChild(card);

        upcomingCount++;

      } else {

        past.appendChild(card);
      }

    } catch (err) {

      // Show processing errors
      console.error(
        "Error processing appointment:",
        err,
        app
      );
    }
  });

  // Update summary text
  document.getElementById("summary-text").innerText =
    `You have ${upcomingCount} upcoming appointment(s)`;
}


// Filters appointments by type
function filterAppointments(type) {

  // Get all appointment cards
  document
    .querySelectorAll(".appointment-card")
    .forEach(card => {

      // Show all cards
      if (type === "all") {

        card.style.display = "flex";

      } else {

        // Show only matching cards
        card.style.display =
          card.dataset.type === type
            ? "flex"
            : "none";
      }
    });
}