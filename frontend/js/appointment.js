const clinicID = new URLSearchParams(window.location.search).get("clinicId");

  function loadClinic() {
  if (!clinicID) return;

  fetch(`/api/clinics/${clinicID}`)
    .then(res => res.json())
    .then(data => {
      booking.clinic = data.clinic?.clinic_name || data.clinic_name;
      booking.clinic_id = clinicID;
    })
    .catch(err => {
      console.error("Failed to load clinic:", err);
    });
}
  // State
  const booking = {
    clinic: '', specialty: '', reason: '',
    date: '', time: '',
    fname: '', lname: '', email: '', phone: '', clinic_id: clinicID
  };
  loadClinic(); 

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appt-date').min = today;
  document.getElementById('appt-date').value = today;
  booking.date = formatDate(today);
  updateTimeSlots();

  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function isPastTimeSlot(timeString, selectedDateValue) {
  const now = new Date();

  const slotDateTime = new Date(selectedDateValue + 'T00:00:00');

  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  slotDateTime.setHours(hours, minutes, 0, 0);

  return slotDateTime < now;
}

function updateTimeSlots() {
  const selectedDateValue = document.getElementById('appt-date').value;

  document.querySelectorAll('.time-slot').forEach(slot => {
    const timeText = slot.textContent.trim();

    if (isPastTimeSlot(timeText, selectedDateValue)) {
      slot.classList.add('unavailable');
      slot.classList.remove('selected');
    } else {
      slot.classList.remove('unavailable');
    }
  });

  if (booking.time) {
    const selectedStillAvailable = [...document.querySelectorAll('.time-slot')].some(
      slot => slot.textContent.trim() === booking.time && !slot.classList.contains('unavailable')
    );

    if (!selectedStillAvailable) {
      booking.time = '';
    }
  }
}
async function loadBookedSlots(date) {
  try {
    const res = await fetch(`/api/appointments/my?clinicId=${booking.clinic_id}`);
    const data = await res.json();

    document.querySelectorAll('.time-slot').forEach(slot => {
      const time = slot.textContent.trim();

      const isBooked = data.some(appt =>
        appt.clinic_id == booking.clinic_id &&
        appt.appointment_date === date &&
        appt.appointment_time === time
      );

      if (isBooked) {
        slot.classList.add('unavailable');
      }
    });

  } catch (err) {
    console.error("Error loading booked slots", err);
  }
}

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
    booking.time = el.textContent;
  }

  function updateDate(val) {
    booking.date = formatDate(val);
    booking.time = '';
  
    document.querySelectorAll('.time-slot').forEach(t => {
      t.classList.remove('selected');
      t.classList.remove('unavailable'); // reset first
    });
  
    updateTimeSlots(); // past times
    loadBookedSlots(val); // 👈 THIS is the new requirement
  }

  function updateBooking() {
    booking.fname = document.getElementById('fname').value;
    booking.lname = document.getElementById('lname').value;
    booking.email = document.getElementById('email').value;
    booking.phone = document.getElementById('phone').value;
  }

  function goToStep(n) {
    // Hide all
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.step').forEach(s => { s.classList.remove('active', 'done'); });

    // Show section
    document.getElementById('section-' + n).classList.add('active');

    // Update step tabs
    for (let i = 1; i <= 4; i++) {
      const tab = document.getElementById('step-tab-' + i);
      if (i < n) tab.classList.add('done');
      else if (i === n) tab.classList.add('active');
    }

    // Populate summary if step 4
    if (n === 4) populateSummary();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function populateSummary() {
    updateBooking();
    document.getElementById('sum-clinic').textContent = booking.clinic || '—';
    document.getElementById('sum-reason').textContent = booking.reason || '—';
    document.getElementById('sum-date').textContent = booking.date || '—';
    document.getElementById('sum-time').textContent = booking.time || '—';
    const name = [booking.fname, booking.lname].filter(Boolean).join(' ');
    document.getElementById('sum-patient').textContent = name || '—';
    document.getElementById('sum-contact').textContent = booking.email || booking.phone || '—';
  }

  function confirmBooking() {
    const patientId = new URLSearchParams(window.location.search).get("patientId");
  
    const bookingData = {
      patient_id: patientId, // important for Sprint 2
      clinic_id: booking.clinic_id, // 👈 THIS is your selected clinic
      appointment_date: document.getElementById('appt-date').value,
      appointment_time: booking.time,
      reason_for_visit: booking.reason,
      phone_number: booking.phone,
      medical_aid: document.getElementById('medical-aid').value,
      additional_notes: document.getElementById('notes').value
    };
  
    fetch('/api/appointments', { // ⚠️ fix endpoint too
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
