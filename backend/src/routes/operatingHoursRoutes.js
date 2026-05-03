const express = require('express');
const router = express.Router();
const { getHours, updateHours } = require('../controllers/operatingHoursController');

router.get('/:id/hours', getHours);
router.patch('/:id/hours', updateHours);

module.exports = router;