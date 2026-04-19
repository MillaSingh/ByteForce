const express = require('express');
const router = express.Router();
const { listClinics, listFilterOptions, getClinicDetails } = require('../controllers/clinicController');

router.get('/filters', listFilterOptions);
router.get('/', listClinics);
router.get('/:id', getClinicDetails);

module.exports = router;