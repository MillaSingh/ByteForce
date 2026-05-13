const express = require("express");
const router = express.Router();

const { requireAuth } = require("./authRoutes");

const {
  getMyQueueEntry,
  checkIn
} = require("../controllers/queueController");

// GET MY QUEUE ENTRY
router.post("/my", requireAuth, getMyQueueEntry);

// CHECK IN TO QUEUE
router.post(
  "/checkin/:appointment_id",
  requireAuth,
  checkIn
);

module.exports = router;
