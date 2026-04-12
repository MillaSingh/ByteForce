const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET queue data with patient names
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        q.queue_id,
        q.queue_position,
        q.status,
        u.first_name,
        u.last_name
      FROM queue_entry q
      JOIN "user" u ON q.patient_id = u.user_id
      ORDER BY q.queue_position ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching queue");
  }
});

// UPDATE status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      `UPDATE queue_entry SET status = $1 WHERE queue_id = $2`,
      [status, id]
    );

    res.send("Updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating");
  }
});

module.exports = router;