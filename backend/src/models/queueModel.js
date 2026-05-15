const pool = require("../db");

// GET CURRENT QUEUE ENTRY FOR USER
const getMyQueueByUserId = async (email) => {
  const query = `
    SELECT 
      qe.queue_id,
      qe.clinic_id,
      c.clinic_name,
      qe.patient_id,
      qe.appointment_id,
      qe.queue_position,
      qe.status,
      qe.check_in_time,
      qe.called_time,

      (
        SELECT COUNT(*)
        FROM queue_entry qe2
        WHERE qe2.clinic_id = qe.clinic_id
        AND LOWER(qe2.status) = 'waiting'
      ) AS people_waiting_at_clinic

    FROM queue_entry qe

    JOIN "user" u
      ON qe.patient_id = u.user_id

    JOIN clinic c
      ON qe.clinic_id = c.clinic_id

    WHERE u.email = $1
      AND LOWER(qe.status) IN (
        'waiting',
        'called',
        'in_progress',
        'in consultation',
        'in_consultation'
      )

    ORDER BY qe.check_in_time DESC NULLS LAST
    LIMIT 1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};

// CREATE QUEUE ENTRY
const createQueueEntry = async (
  appointment_id
) => {

  // Get appointment details
  const appointmentResult =
    await pool.query(
      `
      SELECT
        appointment_id,
        clinic_id,
        patient_id
      FROM appointment
      WHERE appointment_id = $1
      `,
      [appointment_id]
    );

  const appointment =
    appointmentResult.rows[0];

  if (!appointment) {
    throw new Error(
      "Appointment not found"
    );
  }

  // Get next queue number
  const queueCount =
    await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM queue_entry
      WHERE clinic_id = $1
      `,
      [appointment.clinic_id]
    );

  const nextPosition =
    parseInt(
      queueCount.rows[0].total
    ) + 1;

  // Insert queue entry
  const result =
    await pool.query(
      `
      INSERT INTO queue_entry
      (
        clinic_id,
        patient_id,
        appointment_id,
        queue_position,
        status,
        check_in_time
      )

      VALUES ($1,$2,$3,$4,'waiting',NOW())

      RETURNING *
      `,
      [
        appointment.clinic_id,
        appointment.patient_id,
        appointment.appointment_id,
        nextPosition
      ]
    );

  return result.rows[0];
};

// GET QUEUE ENTRY BY APPOINTMENT
const getQueueEntryByAppointment = async (appointment_id) => {
  const result = await pool.query(
    `SELECT * FROM queue_entry WHERE appointment_id = $1`,
    [appointment_id]
  );

  return result.rows[0];
};

// CHECK IN (UPDATE QUEUE ENTRY)
const checkInQueueEntry = async (appointment_id) => {
  const result = await pool.query(
    `UPDATE queue_entry
     SET check_in_time = NOW(),
         status = 'waiting'
     WHERE appointment_id = $1
     RETURNING *`,
    [appointment_id]
  );

  return result.rows[0];
};

module.exports = {
  getMyQueueByUserId,
  getQueueEntryByAppointment,
  checkInQueueEntry,
  createQueueEntry
};
