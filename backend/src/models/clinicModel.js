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

  // dataResult.rows is the array of clinic records returned by SQL
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

  // Get the rows as an array of objects. Transform each object into just the string value.
  return {
    provinces: provinces.rows.map(r => r.province),
    districts: districts.rows.map(r => r.district),
    facilityTypes: facilityTypes.rows.map(r => r.org_unit_type)
  };
};

const getClinicById = async (id) => {
  const clinicResult = await pool.query(
    `SELECT * FROM clinic WHERE clinic_id = $1`, [id]
  );
  const servicesResult = await pool.query(
    `SELECT service_id, service_name FROM clinic_service WHERE clinic_id = $1 ORDER BY service_name`, [id]
  );
  return {
    clinic: clinicResult.rows[0], // take the first and only element from the array
    services: servicesResult.rows
  };
};

const updateClinic = async(id, data) => {
  const result = await pool.query(
    `UPDATE clinic 
    SET address = $2, phone_number = $3,
    description = $4, image_url = $5
    WHERE clinic_id = $1
    RETURNING *`, 
    [id, data.address, data.phone_number, data.description, data.image_url]
  )

  return {
    updatedClinic: result.rows[0]
  }
}

const addService = async(clinicId, serviceName) => {
  const result = await pool.query(
    `INSERT INTO clinic_service (clinic_id, service_name)
    VALUES($1, $2) 
    RETURNING *`, 
    [clinicId, serviceName]
  )

  return {
    newService: result.rows[0]
  }
}

const removeService = async(clinicId, serviceId) => {
  const result = await pool.query(
    `DELETE FROM clinic_service 
    WHERE clinic_id = $1 AND service_id = $2`, 
    [clinicId, serviceId]
  )

  return {
    deletedRow: result.rowCount
  }
}

module.exports = { getClinics, getFilterOptions, getClinicById, updateClinic, addService, removeService };