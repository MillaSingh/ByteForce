const searchInput = document.getElementById('searchInput');
const filterProvince = document.getElementById('filterProvince');
const filterDistrict = document.getElementById('filterDistrict');
const filterType = document.getElementById('filterType');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');
const clinicList = document.getElementById('clinicList');

let currentPage = 1;

function getBadgeClass(orgUnitType) {
    if (orgUnitType === 'Clinic') return 'badge--clinic';
    if (orgUnitType === 'Community Health Centre') return 'badge--chc';
    if (orgUnitType === 'District Hospital' || orgUnitType === 'Regional Hospital') return 'badge--hospital';
    return 'badge--clinic';
}

function renderClinics(clinics, total, totalPages) {
    clinicList.innerHTML = '';

    if (clinics.length === 0) {
        noResults.hidden = false;
        resultCount.textContent = '(0 found)';
        return;
    }

    noResults.hidden = true;
    resultCount.textContent = `(${total} found)`;

    clinics.forEach(clinic => {
        const li = document.createElement('li');
        li.innerHTML = `
      <article class="clinic-card">
        <header class="clinic-card__header">
          <h3>${clinic.clinic_name}</h3>
          <span class="badge ${getBadgeClass(clinic.org_unit_type)}">${clinic.org_unit_type}</span>
        </header>
        <dl class="clinic-card__details">
          <dt>Province</dt><dd>${clinic.province || 'N/A'}</dd>
          <dt>District</dt><dd>${clinic.district || 'N/A'}</dd>
          <dt>Municipality</dt><dd>${clinic.municipality || 'N/A'}</dd>
          <dt>Service Type</dt><dd>${clinic.service_point_type || 'N/A'}</dd>
        </dl>
        <footer class="clinic-card__footer">
          <a href="/html/clinic_details.html?clinicId=${clinic.clinic_id}" class="btn-primary">View &amp; Book</a>
        </footer>
      </article>
    `;
        clinicList.appendChild(li);
    });

    renderPagination(currentPage, totalPages);
}

function renderPagination(page, totalPages) {
    const existing = document.getElementById('pagination');
    if (existing) existing.remove();
    if (totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.id = 'pagination';
    nav.setAttribute('aria-label', 'Clinic results pagination');

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = page === 1;
    prevBtn.addEventListener('click', () => { currentPage--; fetchClinics(); });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = page === totalPages;
    nextBtn.addEventListener('click', () => { currentPage++; fetchClinics(); });

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${page} of ${totalPages}`;

    nav.appendChild(prevBtn);
    nav.appendChild(pageInfo);
    nav.appendChild(nextBtn);

    document.querySelector('.results').appendChild(nav);
}

async function loadFilterOptions() {
  try {
    const response = await fetch('/api/clinics/filters');
    const data = await response.json();

    data.provinces.forEach(p => {
      const option = document.createElement('option');
      option.value = p;
      option.textContent = p;
      filterProvince.appendChild(option);
    });

    data.districts.forEach(d => {
      const option = document.createElement('option');
      option.value = d;
      option.textContent = d;
      filterDistrict.appendChild(option);
    });

    data.facilityTypes.forEach(t => {
      const option = document.createElement('option');
      option.value = t;
      option.textContent = t;
      filterType.appendChild(option);
    });

  } catch (err) {
    console.error('Failed to load filter options:', err);
  }
}

async function fetchClinics() {
    const params = new URLSearchParams({
        search: searchInput.value,
        province: filterProvince.value,
        district: filterDistrict.value,
        facilityType: filterType.value,
        page: currentPage,
        limit: 20
    });

    try {
        const response = await fetch(`/api/clinics?${params}`);
        const data = await response.json();
        renderClinics(data.clinics, data.total, data.totalPages);
    } catch (err) {
        console.error('Failed to fetch clinics:', err);
    }
}

document.getElementById('searchForm').addEventListener('submit', e => e.preventDefault());
searchInput.addEventListener('input', () => { currentPage = 1; fetchClinics(); });
filterProvince.addEventListener('change', () => { currentPage = 1; fetchClinics(); });
filterDistrict.addEventListener('change', () => { currentPage = 1; fetchClinics(); });
filterType.addEventListener('change', () => { currentPage = 1; fetchClinics(); });
document.getElementById('clearFilters').addEventListener('click', () => {
    filterProvince.value = '';
    filterDistrict.value = '';
    filterType.value = '';
    searchInput.value = '';
    currentPage = 1;
    fetchClinics();
});

loadFilterOptions();
fetchClinics();