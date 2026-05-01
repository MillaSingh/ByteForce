const { getMyQueueByUserId  } = require('../models/queueModel');

const getMyQueueEntry = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const queueEntry = await getMyQueueByUserId(email);

    if (!queueEntry) {
      return res.json(null);
    }

    const averageMinutesPerPatient = 10;

    const estimatedWaitMinutes = Math.max(
      0,
      (queueEntry.queue_position - 1) * averageMinutesPerPatient
    );

    return res.json({
      ...queueEntry,
      estimated_wait_minutes: estimatedWaitMinutes
    });

  } catch (err) {
    console.error("Patient queue error:", err);
    return res.status(500).json({ error: "Failed to fetch queue position" });
  }
};

module.exports = {
  getMyQueueEntry
};
