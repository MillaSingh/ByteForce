const appointmentModel = require('../models/appointmentModel');

const createBooking = async (req, res) => {
  try {
    const data = req.body;

    const existing = await appointmentModel.checkSlot(
      data.clinic_id,
      data.appointment_date,
      data.appointment_time
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Time slot already booked"
      });
    }

    const appointment = await appointmentModel.createAppointment(data);

    const ref = "CC-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    return res.json({
      success: true,
      appointment,
      ref
    });

  } catch (err) {
    console.error("FULL ERROR OBJECT:", err);

    return res.status(500).json({
      error: err.message || "unknown error",
      detail: err.detail || null,
      code: err.code || null
    });
  }
};

module.exports = {
  createBooking
};
