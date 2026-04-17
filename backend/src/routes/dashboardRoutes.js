const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

// GET queue data
router.get('/', dashboardController.getQueue);

// UPDATE status
router.patch('/:id', dashboardController.updateStatus);

module.exports = router;