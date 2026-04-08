const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/clinics
// Query params: search, province, district, facilityType, page, limit
router.get('/', async (req, res) => {
  const {
    search = '',
    province = '',
    district = '',
    facilityType = '',
    page = 1,
    limit = 20
  } = req.query;

  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`clinic_name ILIKE $${params.length}`);
  }
  if (province) {
    params.push(province);
    conditions.push(`province = $${params.length}`);
  }
  if (district) {
    params.push(district);
    conditions.push(`district = $${params.length}`);
  }
  if (facilityType) {
    params.push(facilityType);
    conditions.push(`org_unit_type = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM clinic ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataResult = await pool.query(
      `SELECT clinic_id, clinic_name, province, district, municipality, org_unit_type, service_point_type
       FROM clinic ${where}
       ORDER BY clinic_name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      clinics: dataResult.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

module.exports = router;