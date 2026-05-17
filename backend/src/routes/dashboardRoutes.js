const express = require('express');
const router = express.Router();

const { requireAuth } = require('./authRoutes');

const dashboardController = require(
  '../controllers/dashboardController'
);

/*APPOINTMENT ROUTES*/

// RESCHEDULE APPOINTMENT
router.patch(
  '/appointments/:id',
  requireAuth,
  dashboardController.rescheduleAppointment
);

/*CLINIC ROUTES*/

// GET CLINICS
router.get(
  '/clinics',
  requireAuth,
  dashboardController.getClinics
);

/*QUEUE ROUTES */

// GET QUEUE DATA
router.get(
  '/',
  requireAuth,
  dashboardController.getQueue
);

// ADD WALK-IN PATIENT
router.post(
  '/add-walkin',
  requireAuth,
  dashboardController.addWalkInPatient
);

// UPDATE QUEUE STATUS
router.patch(
  '/:id',
  requireAuth,
  dashboardController.updateStatus
);

// DELETE PATIENT FROM QUEUE
router.delete(
  '/:id',
  requireAuth,
  dashboardController.deleteQueuePatient
);

module.exports = router;