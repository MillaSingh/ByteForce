// Read clinicId from URL parameters
const params = new URLSearchParams(window.location.search);
const clinicId = params.get('clinicId');

// DOM elements
const clinicName        = document.getElementById('clinicName');
const clinicBadge       = document.getElementById('clinicBadge');
const clinicImage       = document.getElementById('clinicImage');
const clinicDescription = document.getElementById('clinicDescription');
const metaProvince      = document.getElementById('metaProvince');
const metaDistrict      = document.getElementById('metaDistrict');
const metaMunicipality  = document.getElementById('metaMunicipality');
const metaType          = document.getElementById('metaType');
const metaRuralUrban    = document.getElementById('metaRuralUrban');
const metaAddress       = document.getElementById('metaAddress');
const metaPhone         = document.getElementById('metaPhone');
const servicesList      = document.getElementById('servicesList');
const bookBtn           = document.getElementById('bookBtn');

function getBadgeClass(orgUnitType) {
  if (orgUnitType === 'Clinic') return 'badge--clinic';
  if (orgUnitType === 'Community Health Centre') return 'badge--chc';
  if (orgUnitType === 'District Hospital' || orgUnitType === 'Regional Hospital') return 'badge--hospital';
  return '';
}

function renderClinic(clinic) {
  // Page title
  document.title = `${clinic.clinic_name} | MediQueue`;

  // Hero
  clinicName.textContent = clinic.clinic_name;
  clinicBadge.textContent = clinic.org_unit_type || '';

  if (clinic.image_url) {
    clinicImage.src = clinic.image_url;
    clinicImage.alt = `Image of ${clinic.clinic_name}`;
  } else {
    clinicImage.src = `https://placehold.co/1200x400/1a3c2e/ffffff?text=${encodeURIComponent(clinic.clinic_name)}`;
    clinicImage.alt = `${clinic.clinic_name}`;
  }

  // Description
  clinicDescription.textContent = clinic.description || 'No description has been provided for this facility yet.';

  // Meta details
  metaProvince.textContent     = clinic.province      || '—';
  metaDistrict.textContent     = clinic.district      || '—';
  metaMunicipality.textContent = clinic.municipality  || '—';
  metaType.textContent         = clinic.org_unit_type || '—';
  metaRuralUrban.textContent   = clinic.rural_urban   || '—';
  metaAddress.textContent      = clinic.address       || 'Not yet provided';
  metaPhone.textContent        = clinic.phone_number  || 'Not yet provided';

  // Book button — pass clinicId to appointment page
  bookBtn.href = `appointment.html?clinicId=${clinic.clinic_id}`;
}

function renderServices(services) {
  servicesList.innerHTML = '';

  if (!services || services.length === 0) {
    const li = document.createElement('li');
    li.className = 'no-services';
    li.textContent = 'No services listed yet.';
    servicesList.appendChild(li);
    return;
  }

  services.forEach(service => {
    const li = document.createElement('li');
    li.textContent = service.service_name;
    servicesList.appendChild(li);
  });
}

async function fetchClinicDetails() {
  if (!clinicId) {
    clinicName.textContent = 'Clinic not found';
    clinicDescription.textContent = 'No clinic was specified. Please go back to the clinic listing page.';
    return;
  }

  try {
    const response = await fetch(`/api/clinics/${clinicId}`);

    if (!response.ok) {
      clinicName.textContent = 'Clinic not found';
      clinicDescription.textContent = 'This clinic could not be found. Please go back and try again.';
      return;
    }

    const data = await response.json();
    renderClinic(data.clinic);
    renderServices(data.services);

  } catch (err) {
    console.error('Failed to fetch clinic details:', err);
    clinicName.textContent = 'Error loading clinic';
    clinicDescription.textContent = 'Something went wrong. Please try again later.';
  }
}

fetchClinicDetails();
