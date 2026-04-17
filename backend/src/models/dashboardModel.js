const pool = require('../db');

// GET QUEUE DATA
const getQueuePatients = async () => {
  const result = await pool.query(`
    SELECT 
      q.queue_id,
      q.queue_position,
      q.status,
      u.first_name,
      u.last_name,
      u.email
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

const addWalkInPatient = async (first_name, last_name, email, clinic_id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert into user
    const userResult = await client.query(
      `INSERT INTO "user" (first_name, last_name, email, role)
       VALUES ($1, $2, $3, 'patient')
       RETURNING user_id`,
      [first_name, last_name, email]
    );

    const user_id = userResult.rows[0].user_id;

    // 2. Get next queue position
    const positionResult = await client.query(
      `SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
       FROM queue_entry
       WHERE clinic_id = $1`,
      [clinic_id]
    );

    const queue_position = positionResult.rows[0].next_position;

    // 3. Insert into queue
    const queueResult = await client.query(
      `INSERT INTO queue_entry (clinic_id, patient_id, queue_position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clinic_id, user_id, queue_position]
    );

    await client.query("COMMIT");

    return queueResult.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


module.exports = {
  getQueuePatients,
  updateQueueStatus,
  addWalkInPatient
};