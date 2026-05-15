const express = require('express');
const router = express.Router();
const { getStaff, createStaff, unassignStaff } = require('../controllers/staffController');

// GET /api/staff/:clinicId
router.get('/:clinicId', getStaff);

// POST /api/staff
router.post('/', createStaff);

// PATCH /api/staff/:staffProfileId/unassign/:clinicId
router.patch('/:staffProfileId/unassign/:clinicId', unassignStaff);

module.exports = router;