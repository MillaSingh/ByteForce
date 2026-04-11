const db = require('../db');

// check if slot exists
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

// create appointment
const createAppointment = async (data) => {
  const {
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
    (clinic_id, appointment_date, appointment_time,
     reason_for_visit, phone_number, medical_aid, additional_notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
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

module.exports = {
  checkSlot,
  createAppointment
};
