const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');

// CREATE APPOINTMENT
router.post('/', appointmentController.createBooking);

// GET MY APPOINTMENTS
router.get('/my', appointmentController.getMyAppointments);

module.exports = router;
