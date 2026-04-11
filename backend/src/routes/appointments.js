const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// CREATE BOOKING
router.post('/', appointmentController.createBooking);

module.exports = router;
