const clinics = Array.from(document.querySelectorAll('#clinicList li'));
const searchInput = document.getElementById('searchInput');
const filterProvince = document.getElementById('filterProvince');
const filterDistrict = document.getElementById('filterDistrict');
const filterType = document.getElementById('filterType');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');

function getCardText(card, dt) {
    const dts = card.querySelectorAll('dt');
    for (let i = 0; i < dts.length; i++) {
        if (dts[i].textContent === dt) return card.querySelectorAll('dd')[i].textContent;
    }
    return '';
}

function filterClinics() {
    const search = searchInput.value.toLowerCase();
    const province = filterProvince.value;
    const district = filterDistrict.value;
    const type = filterType.value;
    let visible = 0;

    clinics.forEach(li => {
        const card = li.querySelector('article');
        const name = card.querySelector('h3').textContent.toLowerCase();
        const cardProvince = getCardText(card, 'Province');
        const cardDistrict = getCardText(card, 'District');
        const cardType = card.querySelector('.badge').textContent;

        const matchSearch = name.includes(search);
        const matchProvince = !province || cardProvince === province;
        const matchDistrict = !district || cardDistrict === district;
        const matchType = !type || cardType === type;

        if (matchSearch && matchProvince && matchDistrict && matchType) {
            li.hidden = false;
            visible++;
        } else {
            li.hidden = true;
        }
    });

    resultCount.textContent = `(${visible} found)`;
    noResults.hidden = visible > 0;
}

document.getElementById('searchForm').addEventListener('submit', e => e.preventDefault());
searchInput.addEventListener('input', filterClinics);
filterProvince.addEventListener('change', filterClinics);
filterDistrict.addEventListener('change', filterClinics);
filterType.addEventListener('change', filterClinics);

document.getElementById('clearFilters').addEventListener('click', () => {
    filterProvince.value = '';
    filterDistrict.value = '';
    filterType.value = '';
    searchInput.value = '';
    filterClinics();
});

filterClinics();