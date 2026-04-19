const db = require('../db');

// CHECK SLOT
const checkSlot = async (clinic_id, appointment_date, appointment_time) => {
  const result = await db.query(
    `SELECT * FROM appointment
     WHERE clinic_id = $1
     AND appointment_date = $2
     AND appointment_time = $3`,
    [clinic_id, appointment_date, appointment_time]
  );

  return result.rows;
};

// CREATE APPOINTMENT
const createAppointment = async (data) => {
  const {
    patient_id,
    clinic_id,
    appointment_date,
    appointment_time,
    reason_for_visit,
    phone_number,
    medical_aid,
    additional_notes
  } = data;

  const result = await db.query(
    `INSERT INTO appointment
    (patient_id, clinic_id, appointment_date, appointment_time,
     reason_for_visit, phone_number, medical_aid, additional_notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      patient_id,
      clinic_id,
      appointment_date,
      appointment_time,
      reason_for_visit,
      phone_number,
      medical_aid,
      additional_notes
    ]
  );

  return result.rows[0];
};

// GET APPOINTMENTS BY USER
const getAppointmentsByUser = async (patient_id) => {
  const result = await db.query(
    `SELECT 
        a.*,
        c.clinic_name
     FROM appointment a
     LEFT JOIN clinic c ON a.clinic_id = c.clinic_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patient_id]
  );

  return result.rows;
};

module.exports = {
  checkSlot,
  createAppointment,
  getAppointmentsByUser
};      appointment_date,
      appointment_time,
      reason_for_visit,
      phone_number,
      medical_aid,
      additional_notes
    ]
  );

  return result.rows[0];
};

// get appointments by user
const getAppointmentsByUser = async (patient_id) => {
  const result = await db.query(
    `SELECT 
        a.*,
        c.clinic_name
     FROM appointment a
     LEFT JOIN clinic c ON a.clinic_id = c.clinic_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patient_id]
  );

  return result.rows;
};

module.exports = {
  checkSlot,
  createAppointment,
  getAppointmentsByUser
};
