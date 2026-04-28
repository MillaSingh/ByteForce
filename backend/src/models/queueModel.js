const pool = require('../config/db');

const getMyQueueByUserId = async (patientId) => {
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
        AND qe2.status = 'waiting'
      ) AS people_waiting_at_clinic

    FROM queue_entry qe
    JOIN clinic c ON qe.clinic_id = c.clinic_id
    WHERE qe.patient_id = $1
    AND qe.status IN ('waiting', 'called', 'in_progress')
    ORDER BY qe.check_in_time DESC
    LIMIT 1;
  `;

  const result = await pool.query(query, [patientId]);
  return result.rows[0];
};

module.exports = {
  getMyQueue
};