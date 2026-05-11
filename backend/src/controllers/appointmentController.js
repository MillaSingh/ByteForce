const appointmentModel = require('../models/appointmentModel');

// CREATE BOOKING
const createBooking = async (req, res) => {
  try {
    const data = req.body;

    const user = await appointmentModel.getUserByEmail(data.user_email);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please log in.' });
    }
    data.patient_id = user.user_id;

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

    return res.json({
      success: true,
      appointment
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
    const patientId = req.query.patientId;

    const appointments = await appointmentModel.getAppointmentsByUser(patientId);

    return res.json(appointments);

  } catch (err) {
    console.error("GET APPOINTMENTS ERROR:", err);
    return res.status(500).json({
      error: "Server error"
    });
  }
};

const getSlots = async (req, res) => {
  const { clinicId, date } = req.query;

  if (!clinicId || !date) {
    return res.status(400).json({ error: 'clinicId and date are required' });
  }

  // Prevent booking in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  if (selectedDate < today) {
    return res.status(400).json({ error: 'Cannot book appointments in the past' });
  }

  try {
    const result = await appointmentModel.getAvailableSlots(clinicId, date);
    res.json(result);
  } catch (err) {
    console.error('GET SLOTS ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};
//cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    await appointmentModel.cancelAppointment(appointmentId);

    return res.json({ success: true });

  } catch (err) {
    console.error("CANCEL ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getAppointmentsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone required" });
    }

    const appointments = await appointmentModel.getAppointmentsByPhone(phone);

    return res.json(appointments);

  } catch (err) {
    console.error("PHONE FETCH ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const rescheduleAppointment = async (req, res) => {

  try {

    const appointmentId = req.params.id;

    const {
      clinic_id,
      appointment_date,
      appointment_time
    } = req.body;

    // Prevent past date/time booking
    const now = new Date();

    const selectedDateTime = new Date(
      `${appointment_date}T${appointment_time}`
    );

    if (selectedDateTime <= now) {
      return res.status(400).json({
        error: "Cannot book a past time slot"
      });
    }

    const existing =
      await appointmentModel.checkSlotExcludingCurrent(
        clinic_id,
        appointment_date,
        appointment_time,
        appointmentId
      );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Time slot already booked"
      });
    }

    const updated =
      await appointmentModel.updateAppointmentSlot(
        appointmentId,
        appointment_date,
        appointment_time
      );

    return res.json({
      success: true,
      appointment: updated
    });

  } catch (err) {

    console.error("RESCHEDULE ERROR:", err);

    return res.status(500).json({
      error: "Server error"
    });
  }
};

module.exports = {
  createBooking,
  getMyAppointments,
  getSlots,
  cancelAppointment,
  getAppointmentsByPhone,
  rescheduleAppointment
};
