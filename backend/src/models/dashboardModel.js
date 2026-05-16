const pool = require('../db');

// GET QUEUE DATA
const getQueuePatients = async () => {
  const result = await pool.query(`
    SELECT 
      q.queue_id,
      q.queue_position,
      q.status,
      q.clinic_id,
      q.patient_id,
      c.clinic_name,
      u.first_name,
      u.last_name,
      u.email,
      a.appointment_id,
      a.phone_number,
      a.appointment_date,
      a.appointment_time
    FROM queue_entry q
    LEFT JOIN "user" u 
      ON q.patient_id = u.user_id
    LEFT JOIN clinic c
      ON q.clinic_id = c.clinic_id
    LEFT JOIN LATERAL (
    SELECT 
      appointment_id,
      phone_number,
      appointment_date,
      appointment_time
    FROM appointment
    WHERE patient_id = u.user_id
    AND clinic_id = q.clinic_id
    ORDER BY appointment_date DESC, appointment_time DESC
    LIMIT 1
  ) a ON true
    ORDER BY q.queue_position ASC;
  `);

  return result.rows;
};

// GET CLINICS
const getClinics = async () => {
  const result = await pool.query(`
    SELECT clinic_id, clinic_name
    FROM clinic
    ORDER BY clinic_name ASC;
  `);

  return result.rows;
};
// UPDATE STATUS
const updateQueueStatus = async (id, status) => {

  let query = `
    UPDATE queue_entry
    SET status = $1
  `;

  // If patient is moved to consultation
  if (status === "in_consultation") {
    query += `, called_time = CURRENT_TIMESTAMP`;
  }

  // If patient is marked complete
  if (status === "complete") {
    query += `, complete_time = CURRENT_TIMESTAMP`;
  }

  query += `
    WHERE queue_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [status, id]);

  return result.rows[0];
};


// ADD WALK-IN PATIENT
const addWalkInPatient = async (first_name, last_name, email, clinic_id, phone_number) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check if user already exists by email
    const existingUserResult = await client.query(
      `SELECT user_id
       FROM "user"
       WHERE email = $1`,
      [email]
    );

    let user_id;

    if (existingUserResult.rows.length > 0) {
      // Reuse existing patient
      user_id = existingUserResult.rows[0].user_id;

      // Optional: update their name in case it changed
      await client.query(
        `UPDATE "user"
         SET first_name = $1,
             last_name = $2,
             role = 'patient'
         WHERE user_id = $3`,
        [first_name, last_name, user_id]
      );

    } else {
      // Create new patient only if email does not already exist
      const userResult = await client.query(
        `INSERT INTO "user" (first_name, last_name, email, role)
         VALUES ($1, $2, $3, 'patient')
         RETURNING user_id`,
        [first_name, last_name, email]
      );

      user_id = userResult.rows[0].user_id;
    }

    // 2. Prevent adding the same patient twice to the same active queue
    const existingQueueResult = await client.query(
      `SELECT queue_id
       FROM queue_entry
       WHERE patient_id = $1
       AND clinic_id = $2
       AND status != 'complete'`,
      [user_id, clinic_id]
    );

    if (existingQueueResult.rows.length > 0) {
      throw new Error("Patient is already in this clinic queue");
    }

    // 3. Insert phone number into appointment table
    await client.query(
      `INSERT INTO appointment (patient_id, clinic_id, appointment_date, appointment_time, phone_number)
       VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, $3)`,
      [user_id, clinic_id, phone_number]
    );

    // 4. Get next queue position across the whole dashboard
    const positionResult = await client.query(`
      SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
      FROM queue_entry
    `);

    const queue_position = positionResult.rows[0].next_position;

    // 5. Insert into queue
    const queueResult = await client.query(
      `INSERT INTO queue_entry (clinic_id, patient_id, queue_position, status)
       VALUES ($1, $2, $3, 'waiting')
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
// RESCHEDULE APPOINTMENT
const rescheduleAppointment = async (
  appointment_id,
  appointment_date,
  appointment_time
) => {

  const result = await pool.query(
    `
    UPDATE appointment
    SET appointment_date = $1,
        appointment_time = $2
    WHERE appointment_id = $3
    RETURNING *
    `,
    [appointment_date, appointment_time, appointment_id]
  );

  return result.rows[0];
};
// DELETE PATIENT FROM QUEUE
const deleteQueuePatient = async (id) => {
  const result = await pool.query(
    `DELETE FROM queue_entry
     WHERE queue_id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  getQueuePatients,
  updateQueueStatus,
  addWalkInPatient,
  getClinics,
  rescheduleAppointment,
  deleteQueuePatient
};