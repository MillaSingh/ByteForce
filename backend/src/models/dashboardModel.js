const pool = require('../db');
const renumberQueuePositions = async (dbClient, clinicId) => {
  await dbClient.query(
    `
    WITH ranked_queue AS (
      SELECT
        queue_id,
        ROW_NUMBER() OVER (
          ORDER BY queue_position ASC, queue_id ASC
        ) AS new_position
      FROM queue_entry
      WHERE clinic_id = $1
      AND LOWER(status) != 'complete'
    )
    UPDATE queue_entry q
    SET queue_position = ranked_queue.new_position
    FROM ranked_queue
    WHERE q.queue_id = ranked_queue.queue_id
    `,
    [clinicId]
  );
};

/* GET QUEUE PATIENTS */

// Get all queue patients
const getQueuePatients = async (clinicId) => {

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

    -- Get latest appointment
    LEFT JOIN LATERAL (
      SELECT
        appointment_id,
        phone_number,
        appointment_date,
        appointment_time

      FROM appointment

      WHERE patient_id = u.user_id
      AND clinic_id = q.clinic_id

      ORDER BY
        appointment_date DESC,
        appointment_time DESC

      LIMIT 1
    ) a ON true

    WHERE q.clinic_id = $1
    AND LOWER(q.status) != 'complete'

    ORDER BY q.queue_position ASC;
  `, [clinicId]);

  return result.rows;
};

/* UPDATE STATUS */

// Update queue status
const updateQueueStatus = async (
  id,
  status
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let query = `
      UPDATE queue_entry
      SET status = $1
    `;

    if (status === "in_consultation") {
      query += `
        , called_time = CURRENT_TIMESTAMP
      `;
    }

    if (status === "complete") {
      query += `
        , complete_time = CURRENT_TIMESTAMP
      `;
    }

    query += `
      WHERE queue_id = $2
      RETURNING *
    `;

    const result = await client.query(
      query,
      [status, id]
    );

    const updated = result.rows[0];

    if (!updated) {
      await client.query("ROLLBACK");
      return null;
    }

    if (status === "complete") {
      await renumberQueuePositions(
        client,
        updated.clinic_id
      );
    }

    await client.query("COMMIT");

    return updated;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};

/* ADD WALK-IN PATIENT */

// Add new patient
const addWalkInPatient = async (
  first_name,
  last_name,
  email,
  clinic_id,
  phone_number
) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Check if user exists
    const existingUserResult =
      await client.query(
        `
        SELECT user_id
        FROM "user"
        WHERE email = $1
        `,
        [email]
      );

    let user_id;

    // Reuse existing user
    if (existingUserResult.rows.length > 0) {

      user_id =
        existingUserResult.rows[0].user_id;

      // Update patient info
      await client.query(
        `
        UPDATE "user"
        SET
          first_name = $1,
          last_name = $2,
          role = 'patient'

        WHERE user_id = $3
        `,
        [
          first_name,
          last_name,
          user_id
        ]
      );

    } else {

      // Create new user
      const userResult =
        await client.query(
          `
          INSERT INTO "user"
          (
            first_name,
            last_name,
            email,
            role
          )

          VALUES
          (
            $1,
            $2,
            $3,
            'patient'
          )

          RETURNING user_id
          `,
          [
            first_name,
            last_name,
            email
          ]
        );

      user_id =
        userResult.rows[0].user_id;
    }

    // Check if already in queue
    const existingQueueResult =
      await client.query(
        `
        SELECT queue_id
        FROM queue_entry

        WHERE patient_id = $1
        AND clinic_id = $2
        AND status != 'complete'
        `,
        [
          user_id,
          clinic_id
        ]
      );

    // Stop duplicate patient
    if (
      existingQueueResult.rows.length > 0
    ) {

      throw new Error(
        "Patient is already in this clinic queue"
      );
    }

    // Create appointment
    await client.query(
      `
      INSERT INTO appointment
      (
        patient_id,
        clinic_id,
        appointment_date,
        appointment_time,
        phone_number
      )

      VALUES
      (
        $1,
        $2,
        CURRENT_DATE,
        CURRENT_TIME,
        $3
      )
      `,
      [
        user_id,
        clinic_id,
        phone_number
      ]
    );

    // Get next queue number
    const positionResult =
      await client.query(
        `
        SELECT
          COALESCE(
            MAX(queue_position),
            0
          ) + 1 AS next_position

        FROM queue_entry

        WHERE clinic_id = $1
        AND status != 'complete'
        `,
        [clinic_id]
      );

    const queue_position =
      positionResult.rows[0].next_position;

    // Add patient to queue
    const queueResult =
      await client.query(
        `
        INSERT INTO queue_entry
        (
          clinic_id,
          patient_id,
          queue_position,
          status
        )

        VALUES
        (
          $1,
          $2,
          $3,
          'waiting'
        )

        RETURNING *
        `,
        [
          clinic_id,
          user_id,
          queue_position
        ]
      );

    await client.query("COMMIT");

    return queueResult.rows[0];

  } catch (error) {

    // Undo changes if error
    await client.query("ROLLBACK");

    throw error;

  } finally {

    // Release database client
    client.release();
  }
};

/* DELETE PATIENT */

// Remove patient from queue
const deleteQueuePatient = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      DELETE FROM queue_entry
      WHERE queue_id = $1
      RETURNING *
      `,
      [id]
    );

    const deleted = result.rows[0];

    if (!deleted) {
      await client.query("ROLLBACK");
      return null;
    }

    await renumberQueuePositions(
      client,
      deleted.clinic_id
    );

    await client.query("COMMIT");

    return deleted;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
};

/* GET CLINICS */

// Get clinic details
const getClinics = async (clinicId) => {

  const result = await pool.query(
    `
    SELECT
      clinic_id,
      clinic_name

    FROM clinic

    WHERE clinic_id = $1

    ORDER BY clinic_name ASC;
    `,
    [clinicId]
  );

  return result.rows;
};

/* GET APPOINTMENTS */

// Get future appointments
const getUpcomingAppointments = async (
  clinicId
) => {

  const result = await pool.query(
    `
    SELECT
      a.appointment_id,
      a.appointment_date,
      a.appointment_time,
      u.first_name,
      u.last_name

    FROM appointment a

    JOIN "user" u
      ON a.patient_id = u.user_id

    WHERE a.clinic_id = $1
    AND a.appointment_date >= CURRENT_DATE
    AND a.status != 'cancelled'

    ORDER BY
      a.appointment_date ASC,
      a.appointment_time ASC
    `,
    [clinicId]
  );

  return result.rows;
};

/* RESCHEDULE APPOINTMENT */

// Update appointment date/time
const rescheduleAppointment = async (
  appointmentId,
  appointmentDate,
  appointmentTime
) => {

  const result = await pool.query(
    `
    UPDATE appointment

    SET
      appointment_date = $1,
      appointment_time = $2

    WHERE appointment_id = $3

    RETURNING *
    `,
    [
      appointmentDate,
      appointmentTime,
      appointmentId
    ]
  );

  return result.rows[0];
};

module.exports = {
  getQueuePatients,
  updateQueueStatus,
  addWalkInPatient,
  getClinics,
  deleteQueuePatient,
  getUpcomingAppointments,
  rescheduleAppointment
};