const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

// GET queue data
router.get('/', dashboardController.getQueue);

// UPDATE status
router.patch('/:id', dashboardController.updateStatus);

// add walk-in patient
router.post('/add-walkin', dashboardController.addWalkInPatient);

module.exports = router;