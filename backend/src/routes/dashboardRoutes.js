const express = require('express');

const router = express.Router();

const { requireAuth } =
  require('./authRoutes');

const dashboardController =
  require(
    '../controllers/dashboardController'
  );

/* APPOINTMENT ROUTES */

// Reschedule appointment
router.patch(
  '/appointments/:id',
  requireAuth,
  dashboardController.rescheduleAppointment
);

/* CLINIC ROUTES */

// Get clinic details
router.get(
  '/clinics',
  requireAuth,
  dashboardController.getClinics
);

/* QUEUE ROUTES */

// Get queue data
router.get(
  '/',
  requireAuth,
  dashboardController.getQueue
);

// Add walk-in patient
router.post(
  '/add-walkin',
  requireAuth,
  dashboardController.addWalkInPatient
);

// Update queue status
router.patch(
  '/:id',
  requireAuth,
  dashboardController.updateStatus
);

// Delete patient
router.delete(
  '/:id',
  requireAuth,
  dashboardController.deleteQueuePatient
);

module.exports = router;