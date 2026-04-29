const express = require('express');
const router = express.Router();
const { listClinics, listFilterOptions, getClinicDetails, updateClinicDetails, addClinicService, removeClinicService } = require('../controllers/clinicController');

router.get('/filters', listFilterOptions);
router.get('/', listClinics);
router.get('/:id', getClinicDetails);
router.patch('/:id', updateClinicDetails);
router.post('/:id/services', addClinicService);
router.delete('/:id/services/:serviceId', removeClinicService);

module.exports = router;