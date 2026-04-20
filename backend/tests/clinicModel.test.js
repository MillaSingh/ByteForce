// Mock the database pool before importing the model
jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/db');
const { getClinics, getFilterOptions, getClinicById } = require('../src/models/clinicModel');

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// ── getClinics ──────────────────────────────────────────────────────────────

describe('getClinics', () => {

  test('returns clinics and pagination data with no filters', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '3' }] })          // COUNT query
      .mockResolvedValueOnce({ rows: [                             // data query
        { clinic_id: 1, clinic_name: 'Clinic A', province: 'Gauteng', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' },
        { clinic_id: 2, clinic_name: 'Clinic B', province: 'Gauteng', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' },
        { clinic_id: 3, clinic_name: 'Clinic C', province: 'Gauteng', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' }
      ]});

    const result = await getClinics({ search: '', province: '', district: '', facilityType: '', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(1);
  });

  test('filters clinics by province', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [
        { clinic_id: 1, clinic_name: 'Gauteng Clinic', province: 'Gauteng Province', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' }
      ]});

    const result = await getClinics({ search: '', province: 'Gauteng Province', district: '', facilityType: '', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(1);
    expect(result.clinics[0].province).toBe('Gauteng Province');
    expect(result.total).toBe(1);
  });

  test('filters clinics by district', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [
        { clinic_id: 2, clinic_name: 'Tshwane Clinic', province: 'Gauteng Province', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' }
      ]});

    const result = await getClinics({ search: '', province: '', district: 'Tshwane', facilityType: '', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(1);
    expect(result.clinics[0].district).toBe('Tshwane');
  });

  test('filters clinics by facility type', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [
        { clinic_id: 3, clinic_name: 'City Hospital', province: 'Gauteng Province', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'District Hospital', service_point_type: 'PHC Service' }
      ]});

    const result = await getClinics({ search: '', province: '', district: '', facilityType: 'District Hospital', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(1);
    expect(result.clinics[0].org_unit_type).toBe('District Hospital');
  });

  test('searches clinics by name', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [
        { clinic_id: 4, clinic_name: 'Diepsloot Clinic', province: 'Gauteng Province', district: 'Johannesburg', municipality: 'Johannesburg', org_unit_type: 'Clinic', service_point_type: 'PHC Service' }
      ]});

    const result = await getClinics({ search: 'Diepsloot', province: '', district: '', facilityType: '', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(1);
    expect(result.clinics[0].clinic_name).toBe('Diepsloot Clinic');
  });

  test('returns empty array when no clinics match', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getClinics({ search: 'zzznomatch', province: '', district: '', facilityType: '', page: 1, limit: 20 });

    expect(result.clinics).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  test('calculates pagination correctly', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '45' }] })
      .mockResolvedValueOnce({ rows: new Array(20).fill({ clinic_id: 1, clinic_name: 'Clinic', province: 'Gauteng', district: 'Tshwane', municipality: 'Tshwane', org_unit_type: 'Clinic', service_point_type: 'PHC Service' }) });

    const result = await getClinics({ search: '', province: '', district: '', facilityType: '', page: 1, limit: 20 });

    expect(result.total).toBe(45);
    expect(result.totalPages).toBe(3);
    expect(result.clinics).toHaveLength(20);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(getClinics({ search: '', province: '', district: '', facilityType: '', page: 1, limit: 20 }))
      .rejects.toThrow('Database error');
  });

});

// ── getFilterOptions ────────────────────────────────────────────────────────

describe('getFilterOptions', () => {

  test('returns distinct provinces, districts and facility types', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ province: 'Gauteng Province' }, { province: 'Western Cape Province' }] })
      .mockResolvedValueOnce({ rows: [{ district: 'Tshwane' }, { district: 'City of Cape Town' }] })
      .mockResolvedValueOnce({ rows: [{ org_unit_type: 'Clinic' }, { org_unit_type: 'District Hospital' }] });

    const result = await getFilterOptions();

    expect(result.provinces).toEqual(['Gauteng Province', 'Western Cape Province']);
    expect(result.districts).toEqual(['Tshwane', 'City of Cape Town']);
    expect(result.facilityTypes).toEqual(['Clinic', 'District Hospital']);
  });

  test('returns empty arrays when no data exists', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getFilterOptions();

    expect(result.provinces).toEqual([]);
    expect(result.districts).toEqual([]);
    expect(result.facilityTypes).toEqual([]);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(getFilterOptions()).rejects.toThrow('Database error');
  });

});

// ── getClinicById ───────────────────────────────────────────────────────────

describe('getClinicById', () => {

  test('returns clinic and services for a valid id', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ clinic_id: 1, clinic_name: 'Afsondering Clinic', province: 'Eastern Cape Province', district: 'Alfred Nzo District Municipality', municipality: 'Matatiele Local Municipality', org_unit_type: 'Clinic', description: 'A primary healthcare facility', phone_number: '082 439 4740', address: 'KwaMakhoba Location', image_url: 'https://example.com/image.jpg' }] })
      .mockResolvedValueOnce({ rows: [{ service_name: 'TB Screening' }, { service_name: 'Child Immunisation' }] });

    const result = await getClinicById(1);

    expect(result.clinic).toBeDefined();
    expect(result.clinic.clinic_name).toBe('Afsondering Clinic');
    expect(result.services).toHaveLength(2);
    expect(result.services[0].service_name).toBe('TB Screening');
  });

  test('returns undefined clinic when id does not exist', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getClinicById(99999);

    expect(result.clinic).toBeUndefined();
    expect(result.services).toHaveLength(0);
  });

  test('returns clinic with empty services when none are listed', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ clinic_id: 2, clinic_name: 'Small Clinic', province: 'Limpopo Province', district: 'Capricorn', municipality: 'Polokwane', org_unit_type: 'Clinic' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await getClinicById(2);

    expect(result.clinic).toBeDefined();
    expect(result.services).toHaveLength(0);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(getClinicById(1)).rejects.toThrow('Database error');
  });

});
