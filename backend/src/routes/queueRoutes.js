const express = require("express");
const router = express.Router();

const { requireAuth } = require("./authRoutes");
const { getMyQueueEntry } = require("../controllers/queueController");
// POST route for getting the current user's queue information
router.post("/my", requireAuth, getMyQueueEntry);
module.exports = router;
