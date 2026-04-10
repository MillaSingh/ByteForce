const express = require('express');
const router = express.Router();
const { listClinics, listFilterOptions } = require('../controllers/clinicController');

router.get('/filters', listFilterOptions);
router.get('/', listClinics);

module.exports = router;