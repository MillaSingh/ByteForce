const express = require("express");
const router = express.Router();

const { requireAuth } = require("./authRoutes");
const { getMyQueueEntry } = require("../controllers/queueController");

router.get("/my", requireAuth, getMyQueueEntry);

module.exports = router;