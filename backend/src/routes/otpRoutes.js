
const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

// POST /api/otp/send
router.post('/send', otpController.sendOTP);

// POST /api/otp/verify
router.post('/verify', otpController.verifyOTP);

module.exports = router;

