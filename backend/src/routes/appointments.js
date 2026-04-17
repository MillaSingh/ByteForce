const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Create booking
router.post('/', appointmentController.createBooking);

// Get my appointments
router.get('/my', appointmentController.getMyAppointments);

module.exports = router;
