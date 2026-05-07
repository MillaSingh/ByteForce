const clinicID = new URLSearchParams(window.location.search).get("clinicId");

// ---------------- STATE ----------------
const booking = {
  clinic: '',
  specialty: '',
  reason: '',
  date: '',
  time: '',
  fname: '',
  lname: '',
  email: '',
  phone: '',
  clinic_id: clinicID
};

// ---------------- CLINIC LOAD ----------------
function loadClinic() {
  if (!clinicID) return;

  fetch(`/api/clinics/${clinicID}`)
    .then(res => res.json())
    .then(data => {
      booking.clinic = data?.clinic?.clinic_name || data?.clinic_name || '';
      booking.clinic_id = clinicID;
    })
    .catch(err => console.error("Failed to load clinic:", err));
}

loadClinic();

// ---------------- DATE INIT ----------------
const today = new Date().toISOString().split('T')[0];

const dateInput = document.getElementById('appt-date');
if (dateInput) {
  dateInput.min = today;
  dateInput.value = today;
}

booking.date = today;

loadAvailableSlots(today);

// ---------------- DATE FORMAT ----------------
function formatDate(val) {
  if (!val) return '';
  const d = new Date(val + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ---------------- PAST SLOT CHECK ----------------
function isPastTimeSlot(timeString, selectedDateValue) {
  const now = new Date();
  const slotDateTime = new Date(`${selectedDateValue}T00:00:00`);

  let [hours, minutes] = timeString.split(':').map(Number);
  slotDateTime.setHours(hours, minutes, 0, 0);

  return slotDateTime < now;
}

// ---------------- LOAD AVAILABLE SLOTS FROM API ----------------
async function loadAvailableSlots(date) {
  const timeSlotsContainer = document.getElementById('time-slots');
  const slotsMessage = document.getElementById('slots-message');

  if (!clinicID) {
    timeSlotsContainer.innerHTML = '<p id="slots-message">No clinic selected. Please go back and select a clinic.</p>';
    return;
  }

  // Show loading state
  timeSlotsContainer.innerHTML = '<p id="slots-message">Loading available times...</p>';

  try {
    const response = await fetch(`/api/appointments/slots?clinicId=${clinicID}&date=${date}`);
    const data = await response.json();

    timeSlotsContainer.innerHTML = '';

    if (!data.slots || data.slots.length === 0) {
      timeSlotsContainer.innerHTML = '<p id="slots-message">This clinic is closed on the selected date. Please try another date.</p>';
      booking.time = '';
      return;
    }

    // Render each available slot as a clickable element
    data.slots.forEach(slot => {
      const slotEl = document.createElement('div');
      slotEl.className = 'time-slot';
      slotEl.textContent = slot.time;

      if (!slot.available || isPastTimeSlot(slot.time, date)) {
        slotEl.classList.add('unavailable');
        slotEl.onclick = null;
      } else {
        slotEl.onclick = () => selectTime(slotEl);
      }

      timeSlotsContainer.appendChild(slotEl);
    });

  } catch (err) {
    console.error('Failed to load available slots:', err);
    timeSlotsContainer.innerHTML = '<p id="slots-message">Failed to load available times. Please try again.</p>';
  }
}

// ---------------- DATE UPDATE ----------------
function updateDate(val) {
  booking.date = val;
  booking.time = '';
  loadAvailableSlots(val);
}

// ---------------- UI HANDLERS ----------------
function selectClinic(el, name, spec) {
  document.querySelectorAll('.clinic-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  booking.clinic = name;
  booking.specialty = spec;
}

function selectReason(el) {
  document.querySelectorAll('.reason-tag').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  booking.reason = el.textContent;
}

function selectTime(el) {
  if (el.classList.contains('unavailable')) return;

  document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');

  booking.time = el.textContent.trim();
}

function updateBooking() {
  booking.fname = document.getElementById('fname')?.value || '';
  booking.lname = document.getElementById('lname')?.value || '';
  booking.email = document.getElementById('email')?.value || '';
  booking.phone = document.getElementById('phone')?.value || '';
}

// ---------------- STEPS ----------------
function goToStep(n) {
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active', 'done'));

  document.getElementById('section-' + n).classList.add('active');

  for (let i = 1; i <= 4; i++) {
    const tab = document.getElementById('step-tab-' + i);
    if (!tab) continue;

    if (i < n) tab.classList.add('done');
    else if (i === n) tab.classList.add('active');
  }

  if (n === 4) populateSummary();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------- SUMMARY ----------------
function populateSummary() {
  updateBooking();

  document.getElementById('sum-clinic').textContent = booking.clinic || '—';
  document.getElementById('sum-reason').textContent = booking.reason || '—';
  document.getElementById('sum-date').textContent = booking.date || '—';
  document.getElementById('sum-time').textContent = booking.time || '—';

  const name = [booking.fname, booking.lname].filter(Boolean).join(' ');
  document.getElementById('sum-patient').textContent = name || '—';
  document.getElementById('sum-contact').textContent =
    booking.email || booking.phone || '—';
}

// ---------------- BOOKING ----------------
function confirmBooking() {
  const userEmail = sessionStorage.getItem("userEmail");

  if (!booking.time || !booking.reason || !booking.clinic_id) {
    alert("Please complete all required fields");
    return;
  }

  const bookingData = {
    user_email: userEmail,
    clinic_id: booking.clinic_id,
    appointment_date: document.getElementById('appt-date').value,
    appointment_time: booking.time,
    reason_for_visit: booking.reason,
    phone_number: booking.phone,
    medical_aid: document.getElementById('medical-aid')?.value || '',
    additional_notes: document.getElementById('notes')?.value || ''
  };

  fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('ref-code').textContent = data.ref;

      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-success').classList.add('active');
    })
    .catch(err => {
      console.error('Booking failed:', err);
      alert('Something went wrong saving your booking.');
    });
}

function resetForm() {
  location.reload();
}
