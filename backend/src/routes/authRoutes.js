const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

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
      `SELECT user_id FROM "user" WHERE external_auth_id = $1`,
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        firstName || "",
        lastName || "",
        email,
        uid,
        role || null, // ← null so select_role.html handles it
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
  const email = req.headers["x-user-email"];
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.role, 
              u.id_number, u.date_of_birth, u.created_at,
              sp.clinic_id, sp.job_title, sp.specialties
       FROM "user" u
       LEFT JOIN staff_profile sp ON u.user_id = sp.user_id
       WHERE u.email = $1`,
      [email],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ─── POST /api/auth/sync-password ────────────────────────────────────────────
router.post("/sync-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ error: "email and newPassword are required" });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = await pool.query(
      `SELECT user_id FROM "user" WHERE email = $1`,
      [email],
    );

    if (existing.rowCount === 0) {
      console.warn(`sync-password: no DB record for email ${email}`);
      return res.status(404).json({ error: "User not found in database" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE "user" SET password_hash = $1 WHERE email = $2`, [
      passwordHash,
      email,
    ]);

    console.log(`sync-password: password updated for ${email}`);
    return res.json({ status: "ok" });
  } catch (err) {
    console.error("sync-password error:", err);
    return res.status(500).json({ error: "Failed to update password" });
  }
});

// ─── Middleware: requireAuth ──────────────────────────────────────────────────
// Supports TWO auth paths:
//
//   Path 1 — Cookie (returning / Google-login users):
//     The /session route sets a firebaseToken cookie and adds it to
//     activeSessions. Checked first since it's the fastest path.
//
//   Path 2 — x-user-email header (fresh registrations):
//     After OTP verification, auth.js → storeSession() saves the token to
//     sessionStorage only (no /session call → no cookie).  The frontend sends
//     x-user-email on every request.  We verify the user exists in the DB.
//     This is the same pattern already used by /me and /check-role.
//
// Both paths attach req.userEmail so downstream handlers can use it uniformly.
// ─────────────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  // ── Path 1: cookie ──────────────────────────────────────────────────────
  const cookieToken = req.cookies?.firebaseToken;
  if (cookieToken && activeSessions.has(cookieToken)) {
    req.userEmail =
      activeSessions.get(cookieToken).email ||
      req.headers["x-user-email"] ||
      null;
    return next();
  }

  // ── Path 2: x-user-email header ─────────────────────────────────────────
  const email = req.headers["x-user-email"];
  if (!email) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  // Verify the user actually exists in the DB (prevents spoofing)
  pool
    .query(`SELECT user_id, email FROM "user" WHERE email = $1`, [
      email.toLowerCase().trim(),
    ])
    .then(({ rows }) => {
      if (!rows.length) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }
      req.userEmail = rows[0].email;
      next();
    })
    .catch((err) => {
      console.error("requireAuth DB error:", err);
      res.status(500).json({ error: "Auth lookup failed." });
    });
}

// ─── POST /api/auth/set-role ─────────────────────────────────────────────────
router.post("/set-role", requireAuth, async (req, res) => {
  const email = req.userEmail || req.headers["x-user-email"];
  if (!email) return res.status(400).json({ error: "Email required" });

  const { role, staffProfile } = req.body;
  const VALID_ROLES = ["patient", "staff", "admin"];

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT user_id, role FROM "user" WHERE email = $1`,
      [email],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found." });
    }

    const { user_id, role: existingRole } = rows[0];

    if (existingRole) {
      // Idempotent — safe to call again if the user refreshes mid-flow
      return res.status(200).json({
        message: "Role already set.",
        role: existingRole,
        alreadySet: true,
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(`UPDATE "user" SET role = $1 WHERE user_id = $2`, [
        role,
        user_id,
      ]);

      if (role === "staff" && staffProfile) {
        const { clinic_id, job_title, qualifications, specialties, bio } =
          staffProfile;

        if (!clinic_id || !job_title) {
          throw new Error("clinic_id and job_title are required for staff.");
        }

        await client.query(
          `INSERT INTO staff_profile
             (user_id, clinic_id, job_title, qualifications, specialties, bio)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO UPDATE
             SET clinic_id      = EXCLUDED.clinic_id,
                 job_title      = EXCLUDED.job_title,
                 qualifications = EXCLUDED.qualifications,
                 specialties    = EXCLUDED.specialties,
                 bio            = EXCLUDED.bio`,
          [
            user_id,
            clinic_id,
            job_title,
            qualifications || null,
            JSON.stringify(specialties || []),
            bio || null,
          ],
        );
      }

      await client.query("COMMIT");
      return res.json({ message: "Role saved.", role });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("set-role error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to save role." });
  }
});

// ─── POST /api/auth/verify-admin-code ────────────────────────────────────────
router.post("/verify-admin-code", requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided." });

  const ADMIN_CODE = process.env.ADMIN_INVITE_CODE;
  if (!ADMIN_CODE) {
    console.error("ADMIN_INVITE_CODE is not set in .env");
    return res.status(500).json({ error: "Server configuration error." });
  }

  let match = false;
  try {
    const expected = Buffer.from(ADMIN_CODE.trim());
    const received = Buffer.from(code.trim());
    match =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);
  } catch {
    match = false;
  }

  if (!match) {
    return res
      .status(403)
      .json({ error: "Invalid invite code. Contact your administrator." });
  }

  return res.json({ message: "Code accepted." });
});

// ─── GET /api/auth/check-role ─────────────────────────────────────────────────
router.get("/check-role", requireAuth, async (req, res) => {
  const email = req.userEmail || req.headers["x-user-email"];
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { rows } = await pool.query(
      `SELECT role FROM "user" WHERE email = $1`,
      [email],
    );

    if (!rows.length) return res.status(404).json({ error: "User not found." });

    const role = rows[0].role;
    const redirectMap = {
      patient: "/html/home.html",
      staff: "/html/dashboard.html",
      admin: "/html/admin_dashboard.html",
    };

    return res.json({
      role: role || null,
      redirect: role ? redirectMap[role] : "/html/select_role.html",
    });
  } catch (err) {
    console.error("check-role error:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
