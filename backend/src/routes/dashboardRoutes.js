const { requireAuth } = require('./authRoutes');

const express = require('express');

const router = express.Router();

const dashboardController =
  require('../controllers/dashboardController');



// APPOINTMENT ROUTES

// RESCHEDULE APPOINTMENT
router.patch(
  '/appointments/:id',
  dashboardController.rescheduleAppointment
);



// CLINIC ROUTES


// GET clinics
router.get(
  '/clinics',
  dashboardController.getClinics
);



// QUEUE ROUTES


// GET queue data
router.get(
  '/',
  requireAuth,
  dashboardController.getQueue
);

// ADD walk-in patient
router.post(
  '/add-walkin',
  dashboardController.addWalkInPatient
);

// UPDATE queue status
router.patch(
  '/:id',
  dashboardController.updateStatus
);

// DELETE patient from queue
router.delete(
  '/:id',
  dashboardController.deleteQueuePatient
);


module.exports = router;