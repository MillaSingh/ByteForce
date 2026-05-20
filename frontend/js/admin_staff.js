import { requireRole, getCurrentUser } from '/js/auth.js';

requireRole(['admin']);

// Configuration
const { clinicId } = getCurrentUser();
const CLINIC_ID = clinicId;

// DOM Elements
const staffList = document.getElementById('staffList');
const staffForm = document.getElementById('staffForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

// Show status messages
function showStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;
  formStatus.hidden = false;
  setTimeout(() => { formStatus.hidden = true; }, 5000);
}

// Render staff list
function renderStaff(staff) {
  staffList.innerHTML = '';

  if (!staff || staff.length === 0) {
    const li = document.createElement('li');
    li.className = 'no-staff';
    li.textContent = 'No staff members currently assigned to this clinic.';
    staffList.appendChild(li);
    return;
  }

  staff.forEach(member => {
    const li = document.createElement('li');
    li.innerHTML = `
      <section class="staff-info">
        <span class="staff-name">${member.job_title ? member.job_title + ' ' : ''}${member.first_name} ${member.last_name}</span>
        <span class="staff-email">${member.email}</span>
        ${member.specialties ? `<span class="staff-specialties">${member.specialties}</span>` : ''}
      </section>
      <button class="btn-unassign" type="button" aria-label="Unassign ${member.first_name} ${member.last_name}">
        Unassign
      </button>
    `;
    li.querySelector('.btn-unassign').addEventListener('click', () => {
      unassignStaff(member.staff_profile_id);
    });
    staffList.appendChild(li);
  });
}

// Load staff from backend
async function loadStaff() {
  if (!CLINIC_ID) {
    staffList.innerHTML = '<li class="staff-loading">No clinic assigned. Please contact your administrator.</li>';
    return;
  }

  try {
    const response = await fetch(`/api/staff/${CLINIC_ID}`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    const data = await response.json();
    renderStaff(data.staff);
  } catch (err) {
    console.error('Failed to load staff:', err);
    staffList.innerHTML = '<li class="staff-loading">Failed to load staff. Please refresh the page.</li>';
  }
}

// Unassign staff member
async function unassignStaff(staffProfileId) {
  if (!confirm('Are you sure you want to unassign this staff member from the clinic?')) return;

  try {
    const response = await fetch(`/api/staff/${staffProfileId}/unassign/${CLINIC_ID}`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to unassign staff member');
    showStatus('Staff member unassigned successfully.', 'success');
    await loadStaff();
  } catch (err) {
    console.error('Failed to unassign staff:', err);
    showStatus('Failed to unassign staff member. Please try again.', 'error');
  }
}

// Create staff account
staffForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const jobTitle = document.getElementById('jobTitle').value;
  const specialties = document.getElementById('specialties').value.trim();

  // Validation
  if (!firstName || !lastName || !email || !password || !jobTitle) {
    showStatus('Please fill in all required fields.', 'error');
    return;
  }

  if (password.length < 6) {
    showStatus('Password must be at least 6 characters.', 'error');
    return;
  }

  if (!CLINIC_ID) {
    showStatus('No clinic assigned to your account. Cannot create staff.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        jobTitle,
        specialties,
        clinicId: CLINIC_ID
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showStatus(data.error || 'Failed to create staff account.', 'error');
      return;
    }

    showStatus(`Staff account for ${firstName} ${lastName} created successfully.`, 'success');
    staffForm.reset();
    await loadStaff();

  } catch (err) {
    console.error('Failed to create staff:', err);
    showStatus('Failed to create staff account. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Staff Account';
  }
});

// Initialise
loadStaff();