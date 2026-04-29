const { getClinics, getFilterOptions, getClinicById, updateClinic, addService, removeService } = require('../models/clinicModel');

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

// handles PATCH /api/clinics/:id
const updateClinicDetails = async(req, res) => {
  const id = req.params.id;
  const data = req.body;
  try {
    const result = await updateClinic(id, data);
    if (!result.updatedClinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to update clinic details' });
  }
}

// handles POST /api/clinics/:id/services
const addClinicService = async(req, res) => {
  const id = req.params.id;
  const serviceName = req.body.service_name;
  console.log('req.body:', req.body);
  console.log('serviceName:', serviceName);
  try {
    const result = await addService(id, serviceName);
    if (!serviceName) {
      return res.status(400).json({error: 'Service name is required'});
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to add service' });
  }
}

// handles DELETE /api/clinics/:id/services/:serviceId
const removeClinicService = async(req, res) => {
  const clinicId = req.params.id;
  const serviceId = req.params.serviceId;
  console.log('req.params:', req.params);  // ADD THIS
  console.log('clinicId:', clinicId);      // ADD THIS
  console.log('serviceId:', serviceId);    // ADD THIS
  try {
    const result = await removeService(clinicId, serviceId);
    if (result.deletedRow === 0) {
      return res.status(404).json({error: 'Service not found'});
    }
    res.json({success: true});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'Failed to remove service'});
  }
}

module.exports = { listClinics, listFilterOptions, getClinicDetails, updateClinicDetails, addClinicService, removeClinicService };