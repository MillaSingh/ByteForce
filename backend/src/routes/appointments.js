const express = require("express");
const router = express.Router();

const appointmentController = require("../controllers/appointmentController");

const { requireAuth } = require("./authRoutes");

// GET AVAILABLE SLOTS
router.get(
  "/slots",
  appointmentController.getSlots
);

// CREATE APPOINTMENT
router.post(
  "/",
  appointmentController.createBooking
);

// GET MY APPOINTMENTS
router.get(
  "/my",
  requireAuth,
  appointmentController.getMyAppointments
);

// CANCEL APPOINTMENT
router.delete(
  "/:id",
  requireAuth,
  appointmentController.cancelAppointment
);

// RESCHEDULE APPOINTMENT
router.put(
  "/:id/reschedule",
  requireAuth,
  appointmentController.rescheduleAppointment
);

module.exports = router;
