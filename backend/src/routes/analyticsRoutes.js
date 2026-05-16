const express = require('express');
const router = express.Router();
const { getClinicAnalytics } = require('../controllers/adminDashboardController');

router.get('/:clinicId', getClinicAnalytics);

module.exports = router;