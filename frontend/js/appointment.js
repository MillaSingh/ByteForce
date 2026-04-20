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

  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
  const ref = 'CC-' + Math.random().toString(36).substr(2, 6).toUpperCase();

  const finalBooking = { ...booking, ref };

  fetch('/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(finalBooking)
  })
  .then(res => res.json())
  .then(data => {
    console.log('Saved to DB:', data);

    document.getElementById('ref-code').textContent = ref;
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