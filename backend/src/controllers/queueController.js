const { getMyQueue } = require('../models/queueModel');

const getMyQueueEntry = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const queueEntry = await getMyQueueByUserId(userId);

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