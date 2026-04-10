const pool = require('../db');

const getClinics = async ({ search, province, district, facilityType, page, limit }) => {
  const params = [];
  const conditions = [];
  const offset = (page - 1) * limit;

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

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM clinic ${where}`, params
  );
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT clinic_id, clinic_name, province, district, municipality, org_unit_type, service_point_type
     FROM clinic ${where}
     ORDER BY clinic_name ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { clinics: dataResult.rows, total, totalPages: Math.ceil(total / limit) };
};

const getFilterOptions = async () => {
  const provinces = await pool.query(
    'SELECT DISTINCT province FROM clinic WHERE province IS NOT NULL ORDER BY province'
  );
  const districts = await pool.query(
    'SELECT DISTINCT district FROM clinic WHERE district IS NOT NULL ORDER BY district'
  );
  const facilityTypes = await pool.query(
    'SELECT DISTINCT org_unit_type FROM clinic WHERE org_unit_type IS NOT NULL ORDER BY org_unit_type'
  );

  return {
    provinces: provinces.rows.map(r => r.province),
    districts: districts.rows.map(r => r.district),
    facilityTypes: facilityTypes.rows.map(r => r.org_unit_type)
  };
};

module.exports = { getClinics, getFilterOptions };