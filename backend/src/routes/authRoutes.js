// backend/src/routes/auth.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

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
// Called after every Google sign-in and email sign-up.
// ON CONFLICT (external_auth_id) DO NOTHING means returning users are skipped safely.
router.post("/register", async (req, res) => {
  const { uid, firstName, lastName, email, role } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: "uid and email are required" });
  }

  try {
    // First check if user already exists so we can return isNewUser accurately
    const existing = await pool.query(
      `SELECT user_id FROM "user" WHERE external_auth_id = $1`,
      [uid],
    );

    if (existing.rowCount > 0) {
      return res.json({ isNewUser: false });
    }

    await pool.query(
      `INSERT INTO "user" (first_name, last_name, email, external_auth_id, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [firstName || "", lastName || "", email, uid, role || "patient"],
    );

    return res.json({ isNewUser: true });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

// ─── GET /api/auth/me ── fetch logged-in user's Postgres record ───────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    
    const { uid } = req.body; 
    const result = await pool.query(
      `SELECT user_id, first_name, last_name, email, role, id_number, date_of_birth, created_at
       FROM "user" WHERE external_auth_id = $1`,
      [uid],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});


//   const { requireAuth } = require('./auth');
//   router.get('/protected', requireAuth, handler);
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
