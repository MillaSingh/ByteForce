const appointmentModel = require('../models/appointmentModel');

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const data = req.body;

    // link booking to logged-in user
    data.patient_id = req.user.user_id;

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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET MY APPOINTMENTS
const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.user_id;

    const appointments = await appointmentModel.getAppointmentsByUser(patientId);

    res.json(appointments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createBooking,
  getMyAppointments
};  }
};

module.exports = {
  createBooking
};
