const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const { deleteAccount } = require("../controllers/authController");
router.delete("/delete-account", deleteAccount);

const pool = new Pool({
  host: "clinic-app-db.postgres.database.azure.com",
  port: 5432,
  database: "postgres",
  user: "bdw",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const activeSessions = new Map();

// ─── POST /api/auth/session ── store token after login ───────────────────────
router.post("/session", (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "idToken required" });

  activeSessions.set(idToken, { createdAt: Date.now() });

  res.cookie("firebaseToken", idToken, {
    httpOnly: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  return res.json({ status: "ok" });
});

// ─── DELETE /api/auth/session ── clear token on logout ───────────────────────
router.delete("/session", (req, res) => {
  const token = req.cookies?.firebaseToken;
  if (token) activeSessions.delete(token);
  res.clearCookie("firebaseToken");
  return res.json({ status: "ok" });
});

// ─── POST /api/auth/register ── upsert user into Postgres ────────────────────
router.post("/register", async (req, res) => {
  const {
    uid,
    firstName,
    lastName,
    email,
    role,
    idNumber,
    dateOfBirth,
    password,
  } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: "uid and email are required" });
  }

  try {
    const existing = await pool.query(
      `SELECT user_id FROM "user" WHERE external_auth_id = \$1`,
      [uid],
    );

    if (existing.rowCount > 0) {
      return res.json({ isNewUser: false });
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await pool.query(
      `INSERT INTO "user" (first_name, last_name, email, external_auth_id, role, id_number, date_of_birth, password_hash, created_at)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, NOW())`,
      [
        firstName || "",
        lastName || "",
        email,
        uid,
        role || "patient",
        idNumber || null,
        dateOfBirth || null,
        passwordHash,
      ],
    );

    return res.json({ isNewUser: true });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// ─── GET /api/auth/me ── fetch logged-in user's Postgres record ───────────────
router.get("/me", async (req, res) => {
  const email = req.headers['x-user-email'];
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, 
              u.id_number, u.date_of_birth, u.created_at,
              sp.clinic_id, sp.job_title, sp.specialties
       FROM "user" u
       LEFT JOIN staff_profile sp ON u.user_id = sp.user_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

function requireAuth(req, res, next) {
  const token = req.cookies?.firebaseToken;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  req.firebaseToken = token;
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
