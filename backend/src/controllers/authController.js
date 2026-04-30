// backend/src/controllers/authController.js
const admin = require("firebase-admin");
const { Pool } = require("pg");

const pool = new Pool({
  host: "clinic-app-db.postgres.database.azure.com",
  port: 5432,
  database: "postgres",
  user: "bdw",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const deleteAccount = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    
    await pool.query(`DELETE FROM "user" WHERE external_auth_id = \$1`, [uid]);

    
    await admin.auth().deleteUser(uid);

    
    res.clearCookie("firebaseToken");

    return res.json({ status: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to delete account" });
  }
};

module.exports = { deleteAccount };
