const { getClinics, getFilterOptions, getClinicById } = require('../models/clinicModel');

const listClinics = async (req, res) => {
  const {
    search = '',
    province = '',
    district = '',
    facilityType = '',
    page = 1,
    limit = 20
  } = req.query;

  try {
    const result = await getClinics({
      search, province, district, facilityType,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.json({ ...result, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
};

const listFilterOptions = async (req, res) => {
  try {
    const options = await getFilterOptions();
    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};

const getClinicDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await getClinicById(id);
    if (!result.clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clinic details' });
  }
};

module.exports = { listClinics, listFilterOptions, getClinicDetails };