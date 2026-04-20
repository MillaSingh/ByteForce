// Mock the clinic model before importing the controller
jest.mock('../src/models/clinicModel', () => ({
  getClinics: jest.fn(),
  getFilterOptions: jest.fn(),
  getClinicById: jest.fn()
}));

const { getClinics, getFilterOptions, getClinicById } = require('../src/models/clinicModel');
const { listClinics, listFilterOptions, getClinicDetails } = require('../src/controllers/clinicController');

// Helper to create mock req and res objects
const mockReq = (query = {}, params = {}) => ({ query, params });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listClinics', () => {

  test('returns clinics with default pagination when no query params provided', async () => {
    const fakeResult = { clinics: [{ clinic_id: 1, clinic_name: 'Test Clinic' }], total: 1, totalPages: 1 };
    getClinics.mockResolvedValueOnce(fakeResult);

    const req = mockReq({});
    const res = mockRes();

    await listClinics(req, res);

    expect(getClinics).toHaveBeenCalledWith({
      search: '',
      province: '',
      district: '',
      facilityType: '',
      page: 1,
      limit: 20
    });
    expect(res.json).toHaveBeenCalledWith({ ...fakeResult, page: 1 });
  });

  test('passes search and filter params correctly to model', async () => {
    const fakeResult = { clinics: [], total: 0, totalPages: 0 };
    getClinics.mockResolvedValueOnce(fakeResult);

    const req = mockReq({ search: 'Diepsloot', province: 'Gauteng Province', district: 'Tshwane', facilityType: 'Clinic', page: '2', limit: '20' });
    const res = mockRes();

    await listClinics(req, res);

    expect(getClinics).toHaveBeenCalledWith({
      search: 'Diepsloot',
      province: 'Gauteng Province',
      district: 'Tshwane',
      facilityType: 'Clinic',
      page: 2,
      limit: 20
    });
  });

  test('converts page and limit to integers', async () => {
    getClinics.mockResolvedValueOnce({ clinics: [], total: 0, totalPages: 0 });

    const req = mockReq({ page: '3', limit: '10' });
    const res = mockRes();

    await listClinics(req, res);

    expect(getClinics).toHaveBeenCalledWith(expect.objectContaining({
      page: 3,
      limit: 10
    }));
  });
  test('returns 500 error when model throws', async () => {
    getClinics.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({});
    const res = mockRes();

    await listClinics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch clinics' });
  });
});


describe('listFilterOptions', () => {
  test('returns filter options from model', async () => {
    const fakeOptions = {
      provinces: ['Gauteng Province', 'Western Cape Province'],
      districts: ['Tshwane', 'City of Cape Town'],
      facilityTypes: ['Clinic', 'District Hospital']
    };
    getFilterOptions.mockResolvedValueOnce(fakeOptions);

    const req = mockReq({});
    const res = mockRes();

    await listFilterOptions(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeOptions);
  });

  test('returns 500 error when model throws', async () => {
    getFilterOptions.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({});
    const res = mockRes();

    await listFilterOptions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch filter options' });
  });
});


describe('getClinicDetails', () => {
  test('returns clinic and services for valid id', async () => {
    const fakeResult = {
      clinic: { clinic_id: 1, clinic_name: 'Afsondering Clinic' },
      services: [{ service_name: 'TB Screening' }]
    };
    getClinicById.mockResolvedValueOnce(fakeResult);

    const req = mockReq({}, { id: '1' });
    const res = mockRes();

    await getClinicDetails(req, res);

    expect(getClinicById).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(fakeResult);
  });
  test('returns 404 when clinic is not found', async () => {
    getClinicById.mockResolvedValueOnce({ clinic: undefined, services: [] });

    const req = mockReq({}, { id: '99999' });
    const res = mockRes();

    await getClinicDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Clinic not found' });
  });

  test('returns 500 error when model throws', async () => {
    getClinicById.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({}, { id: '1' });
    const res = mockRes();

    await getClinicDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch clinic details' });
  });

});
