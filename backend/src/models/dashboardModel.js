const pool = require('../db');

// GET QUEUE DATA
const getQueuePatients = async () => {
  const result = await pool.query(`
    SELECT 
      q.queue_id,
      q.queue_position,
      q.status,
      u.first_name,
      u.last_name
    FROM queue_entry q
    LEFT JOIN "user" u 
      ON q.patient_id = u.user_id
    ORDER BY q.queue_position ASC;
  `);

  return result.rows;
};


// UPDATE STATUS
const updateQueueStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE queue_entry 
     SET status = $1 
     WHERE queue_id = $2
     RETURNING *`,
    [status, id]
  );

  return result.rows[0];
};

module.exports = {
  getQueuePatients,
  updateQueueStatus
};