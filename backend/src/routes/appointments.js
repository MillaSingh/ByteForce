const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');

// GET AVAILABLE SLOTS
router.get('/slots', appointmentController.getSlots)

// CREATE APPOINTMENT
router.post('/', appointmentController.createBooking);

// GET MY APPOINTMENTS
router.get('/my', appointmentController.getMyAppointments);
//cancel appointment
router.delete('/:id', appointmentController.cancelAppointment);

module.exports = router;
