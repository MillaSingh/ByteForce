// TEMP: hardcoded clinic ID — replace with admin's assigned clinic from auth
const CLINIC_ID = 4;

// DOM Elements
const clinicForm = document.getElementById('clinicForm');
const clinicName = document.getElementById('clinicName');
const address = document.getElementById('address');
const phoneNumber = document.getElementById('phoneNumber');
const description = document.getElementById('description');
const imageUrl = document.getElementById('imageUrl');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const servicesList = document.getElementById('servicesList');
const addServiceForm = document.getElementById('addServiceForm');
const newServiceInput = document.getElementById('newService');
const serviceStatus = document.getElementById('serviceStatus');

// Image Preview
imageUrl.addEventListener('input', () => {
  const url = imageUrl.value.trim();
  if (url) {
    imagePreview.src = url;
    imagePreviewContainer.hidden = false;
  } else {
    imagePreviewContainer.hidden = true;
  }
});

imagePreview.addEventListener('error', () => {
  imagePreviewContainer.hidden = true;
});

// Show status messages
function showSaveStatus(message, type) {
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;
  saveStatus.hidden = false;
  setTimeout(() => { saveStatus.hidden = true; }, 4000);
}

function showServiceStatus(message, type) {
  serviceStatus.textContent = message;
  serviceStatus.className = `service-status ${type}`;
  serviceStatus.hidden = false;
  setTimeout(() => { serviceStatus.hidden = true; }, 4000);
}

// Render services list
function renderServices(services) {
  servicesList.innerHTML = '';

  if (!services || services.length === 0) {
    const li = document.createElement('li');
    li.className = 'services-loading';
    li.textContent = 'No services listed yet. Add one below.';
    servicesList.appendChild(li);
    return;
  }

  services.forEach(service => {
    const li = document.createElement('li');
    li.dataset.serviceId = service.service_id;
    li.innerHTML = `
      <span>${service.service_name}</span>
      <button class="btn-remove" type="button" aria-label="Remove ${service.service_name}">Remove</button>
    `;
    li.querySelector('.btn-remove').addEventListener('click', () => {
      removeService(service.service_id);
    });
    servicesList.appendChild(li);
  });
}

// Fetch and populate clinic data
async function loadClinicData() {
  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}`);
    if (!response.ok) throw new Error('Failed to fetch clinic');

    const data = await response.json();
    const clinic = data.clinic;
    const services = data.services;

    // Populate form fields
    clinicName.value   = clinic.clinic_name        || '';
    address.value      = clinic.address            || '';
    phoneNumber.value  = clinic.phone_number       || '';
    description.value  = clinic.description        || '';
    imageUrl.value     = clinic.image_url          || '';

    // Show image preview if URL exists
    if (clinic.image_url) {
      imagePreview.src = clinic.image_url;
      imagePreviewContainer.hidden = false;
    }

    renderServices(services);

  } catch (err) {
    console.error('Failed to load clinic data:', err);
    showSaveStatus('Failed to load clinic data. Please refresh the page.', 'error');
  }
}

// Save clinic details
clinicForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Basic validation
  if (!address.value.trim()) {
    showSaveStatus('Address is required.', 'error');
    address.focus();
    return;
  }
  if (!phoneNumber.value.trim()) {
    showSaveStatus('Phone number is required.', 'error');
    phoneNumber.focus();
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address:      address.value.trim(),
        phone_number: phoneNumber.value.trim(),
        description:  description.value.trim(),
        image_url:    imageUrl.value.trim()
      })
    });

    if (!response.ok) throw new Error('Failed to save');

    showSaveStatus('Clinic details saved successfully.', 'success');

  } catch (err) {
    console.error('Failed to save clinic details:', err);
    showSaveStatus('Failed to save changes. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
  }
});

// Add service
addServiceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const serviceName = newServiceInput.value.trim();
  if (!serviceName) {
    showServiceStatus('Please enter a service name.', 'error');
    newServiceInput.focus();
    return;
  }

  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_name: serviceName })
    });

    if (!response.ok) throw new Error('Failed to add service');

    newServiceInput.value = '';
    showServiceStatus(`"${serviceName}" added successfully.`, 'success');

    // Reload services list
    await reloadServices();

  } catch (err) {
    console.error('Failed to add service:', err);
    showServiceStatus('Failed to add service. Please try again.', 'error');
  }
});

// Remove service
async function removeService(serviceId) {
  console.log('removing serviceId:', serviceId);  // ADD THIS
  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}/services/${serviceId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to remove service');

    showServiceStatus('Service removed successfully.', 'success');

    // Reload services list
    await reloadServices();

  } catch (err) {
    console.error('Failed to remove service:', err);
    showServiceStatus('Failed to remove service. Please try again.', 'error');
  }
}

// Reload services list
async function reloadServices() {
  try {
    const response = await fetch(`/api/clinics/${CLINIC_ID}`);
    if (!response.ok) throw new Error('Failed to fetch services');
    const data = await response.json();
    renderServices(data.services);
  } catch (err) {
    console.error('Failed to reload services:', err);
  }
}

// Initialise
loadClinicData();