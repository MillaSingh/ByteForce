async function loadAppointments() {
      const upcoming = document.getElementById("upcoming");
      const past = document.getElementById("past");
      const loading = document.getElementById("loading");
      const empty = document.getElementById("empty");

      upcoming.innerHTML = "";
      past.innerHTML = "";

      try {
        const res = await fetch("/api/appointments/my");

        if (!res.ok) {
          throw new Error("Server error");
        }

        const data = await res.json();

        loading.style.display = "none";

        if (!Array.isArray(data) || data.length === 0) {
          empty.style.display = "block";
          return;
        }

        const now = new Date();
        let upcomingCount = 0;

        data.forEach(app => {
          if (!app.appointment_date || !app.appointment_time) return;

          // const dateTime = new Date(`${app.appointment_date}T${app.appointment_time}`);
          const rawDate = new Date(app.appointment_date);
          const dateStr = rawDate.toISOString().split('T')[0];
          const dateTime = new Date(`${dateStr}T${app.appointment_time}`);

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
            ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div class="status ${status}">
          ${status}
        </div>
      `;

          card.onclick = () => {
            alert(
              `Clinic: ${app.clinic_name || "Clinic"}\n` +
              `Date: ${dateTime.toLocaleDateString()}\n` +
              `Time: ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
              `Status: ${status}`
            );
          };

          if (isUpcoming) {
            upcoming.appendChild(card);
            upcomingCount++;
          } else {
            past.appendChild(card);
          }
        });

        document.getElementById("summary-text").innerText =
          `You have ${upcomingCount} upcoming appointment(s)`;

      } catch (err) {
        console.error(err);
        loading.innerText = "Failed to load appointments 😢";
      }
    }

    function filterAppointments(type) {
      document.querySelectorAll(".appointment-card").forEach(card => {
        if (type === "all") {
          card.style.display = "flex";
        } else {
          card.style.display = card.dataset.type === type ? "flex" : "none";
        }
      });
    }

    loadAppointments();