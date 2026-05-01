const pool = require("../db");

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

    ORDER BY qe.check_in_time DESC
    LIMIT 1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0];
};

module.exports = {
  getMyQueueByUserId,
};