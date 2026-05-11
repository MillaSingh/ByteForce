// Import the function that gets a user's queue entry from the queue model
const { getMyQueueByUserId } = require("../models/queueModel");

// Get the logged-in user's queue entry
const getMyQueueEntry = async (req, res) => {
  try {
// Get the user's email
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Use the email to find the user's current queue entry in the database
    const queueEntry = await getMyQueueByUserId(email);

    // If the user is not currently in the queue, return null
    if (!queueEntry) {
      return res.json(null);
    }

    const averageMinutesPerPatient = 10;

    // Calculate the estimated waiting time
    // Math.max makes sure the wait time never goes below 0
    const estimatedWaitMinutes = Math.max(
      0,
      (queueEntry.queue_position - 1) * averageMinutesPerPatient
    );

    // Send back the user's queue entry together with the estimated wait time
    return res.json({
      ...queueEntry,
      estimated_wait_minutes: estimatedWaitMinutes,
    });
  } catch (err) {
    console.error("Patient queue error:", err);

    return res.status(500).json({ error: "Failed to fetch queue position" });
  }
};

module.exports = {
  getMyQueueEntry,
};