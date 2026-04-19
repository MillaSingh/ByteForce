const appointmentModel = require('../models/appointmentModel');

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const data = req.body;

    // TEMP USER (replace with auth later)
    const patientId = 1;
    data.patient_id = patientId;

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
    console.error("CREATE BOOKING ERROR:", err);
    return res.status(500).json({
      error: "Server error"
    });
  }
};

// GET MY APPOINTMENTS
const getMyAppointments = async (req, res) => {
  try {
    const patientId = 1; // TEMP USER

    const appointments = await appointmentModel.getAppointmentsByUser(patientId);

    return res.json(appointments);

  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);
    return res.status(500).json({
      error: "Server error"
    });
  }
};

module.exports = {
  createBooking,
  getMyAppointments
};
