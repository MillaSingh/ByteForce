const pool = require('../db');

const getOperatingHours = async (clinicId) => {
  const result = await pool.query(
    `SELECT hours_id, day_of_week, open_time, close_time, is_closed, slot_capacity
     FROM clinic_operating_hours
     WHERE clinic_id = $1
     ORDER BY CASE day_of_week
       WHEN 'Monday'    THEN 1
       WHEN 'Tuesday'   THEN 2
       WHEN 'Wednesday' THEN 3
       WHEN 'Thursday'  THEN 4
       WHEN 'Friday'    THEN 5
       WHEN 'Saturday'  THEN 6
       WHEN 'Sunday'    THEN 7
     END`,
    [clinicId]
  );
  return result.rows;
};

const saveOperatingHours = async (clinicId, hours) => {
  // Use a transaction so either all 7 days save or none do
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const entry of hours) {
      await client.query(
        `INSERT INTO clinic_operating_hours
           (clinic_id, day_of_week, open_time, close_time, is_closed, slot_capacity)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (clinic_id, day_of_week)
         DO UPDATE SET
           open_time     = EXCLUDED.open_time,
           close_time    = EXCLUDED.close_time,
           is_closed     = EXCLUDED.is_closed,
           slot_capacity = EXCLUDED.slot_capacity`,
        [
          clinicId,
          entry.day_of_week,
          entry.open_time     || null,
          entry.close_time    || null,
          entry.is_closed     || false,
          entry.slot_capacity || 1
        ]
      );
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getOperatingHours, saveOperatingHours };