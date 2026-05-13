const queueModel = require("../models/queueModel");

// GET MY QUEUE ENTRY
const getMyQueueEntry = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const queueEntry =
      await queueModel.getMyQueueByUserId(email);

    if (!queueEntry) {
      return res.json(null);
    }

    const estimatedWaitMinutes = Math.max(
      0,
      (queueEntry.queue_position - 1) * 10
    );

    return res.json({
      ...queueEntry,
      estimated_wait_minutes: estimatedWaitMinutes
    });

  } catch (err) {

    console.error("QUEUE ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch queue position"
    });
  }
};

// CHECK IN
const checkIn = async (req, res) => {

  try {

    const appointment_id = req.params.appointment_id;

    if (!appointment_id) {
      return res.status(400).json({
        error: "Missing appointment_id"
      });
    }

    const queueEntry =
      await queueModel.getQueueEntryByAppointment(appointment_id);

    if (!queueEntry) {
      return res.status(404).json({
        error: "Queue entry not found"
      });
    }

    if (queueEntry.check_in_time) {
      return res.status(400).json({
        error: "Already checked in"
      });
    }

    const updated =
      await queueModel.checkInQueueEntry(appointment_id);

    return res.json({
      success: true,
      queue: updated
    });

  } catch (err) {

    console.error("CHECKIN ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
};

module.exports = {
  getMyQueueEntry,
  checkIn
};
