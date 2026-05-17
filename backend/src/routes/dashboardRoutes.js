const { requireAuth } = require('./authRoutes');
const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

// GET clinics
router.get('/clinics', dashboardController.getClinics);

// GET queue data

router.get('/', requireAuth, dashboardController.getQueue);

// UPDATE status
router.patch('/:id', dashboardController.updateStatus);

// DELETE patient from queue
router.delete('/:id', dashboardController.deleteQueuePatient);

// add walk-in patient
router.post('/add-walkin', dashboardController.addWalkInPatient);


module.exports = router;