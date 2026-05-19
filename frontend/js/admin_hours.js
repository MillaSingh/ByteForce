import { requireRole, getCurrentUser } from '/js/auth.js';
requireRole(['admin']);

// Replace with clinic ID from logged-in admin's profile
const { clinicId } = getCurrentUser();
const CLINIC_ID = clinicId;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// DOM Elements
const hoursForm = document.getElementById('hoursForm');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const tableBody = document.getElementById('hoursTableBody');

// Show status messages
function showStatus(message, type) {
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;
  saveStatus.hidden = false;
  setTimeout(() => { saveStatus.hidden = true; }, 4000);
}

// Get row elements for a specific day
function getRowElements(day) {
  const row = tableBody.querySelector(`tr[data-day="${day}"]`);
  return {
    row,
    isClosed: row.querySelector('.is-closed'),
    openTime: row.querySelector('.open-time'),
    closeTime: row.querySelector('.close-time'),
    slotCapacity: row.querySelector('.slot-capacity')
  };
}

// Toggle row disabled state when closed checkbox is ticked
function toggleRowDisabled(day, disabled) {
  const { row, openTime, closeTime, slotCapacity } = getRowElements(day);
  openTime.disabled = disabled;
  closeTime.disabled = disabled;
  slotCapacity.disabled = disabled;
  if (disabled) {
    row.classList.add('is-closed-row');
    openTime.value = '';
    closeTime.value = '';
    slotCapacity.value = '1';
  } else {
    row.classList.remove('is-closed-row');
  }
}

// Attach closed checkbox listeners
function attachCheckboxListeners() {
  DAYS.forEach(day => {
    const { isClosed } = getRowElements(day);
    isClosed.addEventListener('change', () => {
      toggleRowDisabled(day, isClosed.checked);
    });
  });
}

// Populate form from database data
function populateForm(hoursData) {
  DAYS.forEach(day => {
    const { isClosed, openTime, closeTime, slotCapacity } = getRowElements(day);

    // Find matching record for this day
    const record = hoursData.find(h => h.day_of_week === day);

    if (record) {
      isClosed.checked = record.is_closed;
      slotCapacity.value = record.slot_capacity || 1;

      if (record.is_closed) {
        toggleRowDisabled(day, true);
      } else {
        // PostgreSQL returns time as 'HH:MM:SS' — strip seconds for input[type=time]
        openTime.value = record.open_time  ? record.open_time.slice(0, 5)  : '';
        closeTime.value = record.close_time ? record.close_time.slice(0, 5) : '';
      }
    }
  });
}

// Load operating hours from backend
async function loadHours() {
  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}/hours`);
    if (!response.ok) throw new Error('Failed to fetch hours');
    const data = await response.json();
    populateForm(data.hours);
  } catch (err) {
    console.error('Failed to load operating hours:', err);
    showStatus('Failed to load operating hours. Please refresh the page.', 'error');
  }
}

// Validate form before saving
function validateForm(hoursPayload) {
  // Clear previous error highlights
  tableBody.querySelectorAll('input').forEach(input => {
    input.classList.remove('input-error');
  });

  for (const entry of hoursPayload) {
    if (entry.is_closed) continue;

    const { openTime, closeTime, slotCapacity } = getRowElements(entry.day_of_week);

    // Check open and close times are provided
    if (!entry.open_time) {
      openTime.classList.add('input-error');
      showStatus(`Please set an open time for ${entry.day_of_week}.`, 'error');
      return false;
    }
    if (!entry.close_time) {
      closeTime.classList.add('input-error');
      showStatus(`Please set a close time for ${entry.day_of_week}.`, 'error');
      return false;
    }

    // Check close time is after open time
    if (entry.close_time <= entry.open_time) {
      closeTime.classList.add('input-error');
      openTime.classList.add('input-error');
      showStatus(`Close time must be after open time for ${entry.day_of_week}.`, 'error');
      return false;
    }

    // Check slot capacity is valid
    if (!entry.slot_capacity || entry.slot_capacity < 1) {
      slotCapacity.classList.add('input-error');
      showStatus(`Slot capacity must be at least 1 for ${entry.day_of_week}.`, 'error');
      return false;
    }
  }

  return true;
}

// Build payload from form
function buildPayload() {
  return DAYS.map(day => {
    const { isClosed, openTime, closeTime, slotCapacity } = getRowElements(day);
    return {
      day_of_week: day,
      is_closed: isClosed.checked,
      open_time: isClosed.checked ? null : openTime.value || null,
      close_time: isClosed.checked ? null : closeTime.value || null,
      slot_capacity: isClosed.checked ? 0 : parseInt(slotCapacity.value) || 1
    };
  });
}

// Save operating hours
hoursForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const hoursPayload = buildPayload();

  // Validate before sending
  if (!validateForm(hoursPayload)) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}/hours`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: hoursPayload })
    });

    if (!response.ok) throw new Error('Failed to save');

    showStatus('Operating hours saved successfully.', 'success');

  } catch (err) {
    console.error('Failed to save operating hours:', err);
    showStatus('Failed to save hours. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Hours';
  }
});

// Initialise
attachCheckboxListeners();
loadHours();