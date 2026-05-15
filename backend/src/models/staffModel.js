const pool = require('../db');

const getStaffByClinic = async (clinicId) => {
  const result = await pool.query(
    `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role,
            sp.staff_profile_id, sp.job_title, sp.specialties
     FROM "user" u
     JOIN staff_profile sp ON u.user_id = sp.user_id
     WHERE sp.clinic_id = $1 AND u.role = 'staff'
     ORDER BY u.first_name ASC`,
    [clinicId]
  );
  return result.rows;
};

const createStaffProfile = async (userId, clinicId, jobTitle, specialties) => {
  const result = await pool.query(
    `INSERT INTO staff_profile (user_id, clinic_id, job_title, specialties)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, clinicId, jobTitle, specialties || null]
  );
  return result.rows[0];
};

const createStaffUser = async (firstName, lastName, email, uid, passwordHash, jobTitle, specialties, clinicId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO "user" (first_name, last_name, email, external_auth_id, role, password_hash, created_at)
       VALUES ($1, $2, $3, $4, 'staff', $5, NOW())
       RETURNING user_id`,
      [firstName, lastName, email, uid, passwordHash]
    );
    const userId = userResult.rows[0].user_id;

    await client.query(
      `INSERT INTO staff_profile (user_id, clinic_id, job_title, specialties)
       VALUES ($1, $2, $3, $4)`,
      [userId, clinicId, jobTitle, specialties || null]
    );

    await client.query('COMMIT');
    return { userId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const unassignStaff = async (staffProfileId, clinicId) => {
  const result = await pool.query(
    `UPDATE staff_profile SET clinic_id = NULL
     WHERE staff_profile_id = $1 AND clinic_id = $2`,
    [staffProfileId, clinicId]
  );
  return { updatedRow: result.rowCount };
};

const checkEmailExists = async (email) => {
  const result = await pool.query(
    `SELECT user_id FROM "user" WHERE email = $1`,
    [email]
  );
  return result.rowCount > 0;
};

module.exports = { getStaffByClinic, createStaffProfile, createStaffUser, unassignStaff, checkEmailExists };