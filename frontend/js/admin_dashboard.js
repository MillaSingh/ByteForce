import { requireRole, getCurrentUser } from '/js/auth.js';
requireRole(['admin']);

const { clinicId } = getCurrentUser();
const CLINIC_ID = clinicId;

// Chart instances
let appointmentsChart = null;
let statusChart = null;

// All appointments data (for CSV export)
let allAppointments = [];

// Fetch all dashboard data
async function loadDashboard() {
    if (!CLINIC_ID) {
        document.getElementById('clinicNameHeader').textContent =
            'No clinic assigned to your account.';
        return;
    }

    try {
        const response = await fetch(`/api/dashboard/analytics/${CLINIC_ID}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        renderSummaryCards(data);
        renderWeeklyChart(data.weeklyAppointments);
        renderStatusChart(data.statusBreakdown);
        renderRecentAppointments(data.recentAppointments);
        allAppointments = data.recentAppointments;
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

// Summary cards
function renderSummaryCards(data) {
    document.getElementById('appointmentsToday').textContent =
        data.appointmentsToday ?? '—';

    document.getElementById('totalAppointments').textContent =
        data.totalAppointments ?? '—';

    const noShowRate = data.noShowRate;
    document.getElementById('noShowRate').textContent =
        noShowRate !== null ? `${noShowRate}%` : '—';

    const avgWait = data.avgWaitMinutes;
    if (avgWait !== null && avgWait !== undefined) {
        document.getElementById('avgWaitTime').textContent = `${avgWait} min`;
        document.getElementById('waitTimeSub').textContent =
            'Average from check-in to consultation';
    } else {
        document.getElementById('avgWaitTime').textContent = 'N/A';
        document.getElementById('waitTimeSub').textContent =
            'Check-in tracking not yet active';
    }
}

function renderWeeklyChart(weeklyData) {
  const labels = weeklyData.map(d => {
    const date = new Date(d.day + 'T00:00:00');
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  });
  const counts = weeklyData.map(d => d.count);

  const context = document.getElementById('appointmentsChart').getContext('2d');

  if (appointmentsChart) appointmentsChart.destroy();

  appointmentsChart = new Chart(context, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Appointments',
        data: counts,
        backgroundColor: 'rgba(82, 183, 136, 0.7)',
        borderColor: '#2d6a4f',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// Status breakdown doughnut chart
function renderStatusChart(statusData) {
    const labels = statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1));
    const counts = statusData.map(s => s.count);
    const colours = statusData.map(s => {
        if (s.status === 'completed') return 'rgba(82, 183, 136, 0.8)';
        if (s.status === 'confirmed') return 'rgba(41, 128, 185, 0.8)';
        if (s.status === 'cancelled') return 'rgba(192, 57, 43, 0.8)';
        if (s.status === 'pending') return 'rgba(230, 126, 34, 0.8)';
        return 'rgba(107, 140, 116, 0.8)';
    });

    const context = document.getElementById('statusChart').getContext('2d');

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(context, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: colours,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Recent appointments table
function renderRecentAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTableBody');
    tbody.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-loading">No appointments found.</td></tr>';
        return;
    }

    appointments.forEach(appt => {
        const rawDate = appt.appointment_date
            ? appt.appointment_date.toString().split('T')[0]
            : null;

        const formattedDate = rawDate
            ? new Date(rawDate + 'T00:00:00').toLocaleDateString('en-ZA', {
                day: 'numeric', month: 'short', year: 'numeric'
            })
            : '—';
        const formattedTime = appt.appointment_time
            ? appt.appointment_time.slice(0, 5)
            : '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${formattedTime}</td>
      <td>${appt.first_name || '—'} ${appt.last_name || ''}</td>
      <td>${appt.reason_for_visit || '—'}</td>
      <td><span class="status-badge ${appt.status}">${appt.status}</span></td>
    `;

        // append the new row to the table body
        tbody.appendChild(tr);
    });
}

// CSV Export
document.getElementById('exportBtn').addEventListener('click', () => {
    // If the appointments table is empty, show a popup instead of exporting a csv file
    if (!allAppointments.length) {
        alert('No appointments to export.');
        return;
    }

    const headers = ['Date', 'Time', 'Patient First Name', 'Patient Last Name', 'Reason', 'Status'];
    const rows = allAppointments.map(appt => [
        appt.appointment_date,
        appt.appointment_time ? appt.appointment_time.slice(0, 5) : '',
        appt.first_name || '',
        appt.last_name || '',
        appt.reason_for_visit || '',
        appt.status
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    // create an in-memory file containing the csv content
    const blob = new Blob([csvContent], { type: 'text/csv' });

    // create a temporary URL that can be used to download the file
    const url = URL.createObjectURL(blob);

    // create an invisible link in memory set to the blob URL
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_appointments_${new Date().toISOString().split('T')[0]}.csv`;

    // Trigger the browser to download the file
    a.click();

    // Delete the temporary URL from memory after the download is triggered
    URL.revokeObjectURL(url);
});

// Initialise
loadDashboard();