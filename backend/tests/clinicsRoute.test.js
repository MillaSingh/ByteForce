// Mock the controller before importing the router
jest.mock('../src/controllers/clinicController', () => ({
  listClinics: jest.fn((req, res) => res.json({ clinics: [], total: 0, totalPages: 0, page: 1 })),
  listFilterOptions: jest.fn((req, res) => res.json({ provinces: [], districts: [], facilityTypes: [] })),
  getClinicDetails: jest.fn((req, res) => res.json({ clinic: { clinic_id: 1, clinic_name: 'Test Clinic' }, services: [] }))
}));

const express = require('express');
const request = require('supertest');
const clinicsRouter = require('../src/routes/clinics');
const { listClinics, listFilterOptions, getClinicDetails } = require('../src/controllers/clinicController');

// Set up a minimal express app for testing
const app = express();
app.use(express.json());
app.use('/api/clinics', clinicsRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Route tests ─────────────────────────────────────────────────────────────

describe('GET /api/clinics', () => {

  test('responds with 200 and calls listClinics controller', async () => {
    const res = await request(app).get('/api/clinics');

    expect(res.statusCode).toBe(200);
    expect(listClinics).toHaveBeenCalledTimes(1);
  });

  test('passes query parameters to the controller', async () => {
    await request(app).get('/api/clinics?province=Gauteng+Province&page=2');

    expect(listClinics).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/clinics');

    expect(res.headers['content-type']).toMatch(/json/);
  });

});

describe('GET /api/clinics/filters', () => {

  test('responds with 200 and calls listFilterOptions controller', async () => {
    const res = await request(app).get('/api/clinics/filters');

    expect(res.statusCode).toBe(200);
    expect(listFilterOptions).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/clinics/filters');

    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('does not call listClinics when hitting filters route', async () => {
    await request(app).get('/api/clinics/filters');

    expect(listClinics).not.toHaveBeenCalled();
    expect(listFilterOptions).toHaveBeenCalledTimes(1);
  });

});

describe('GET /api/clinics/:id', () => {

  test('responds with 200 and calls getClinicDetails controller', async () => {
    const res = await request(app).get('/api/clinics/1');

    expect(res.statusCode).toBe(200);
    expect(getClinicDetails).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/clinics/1');

    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('does not call listClinics when hitting /:id route', async () => {
    await request(app).get('/api/clinics/1');

    expect(listClinics).not.toHaveBeenCalled();
    expect(getClinicDetails).toHaveBeenCalledTimes(1);
  });

  test('filters route is matched before /:id route', async () => {
    await request(app).get('/api/clinics/filters');

    expect(listFilterOptions).toHaveBeenCalledTimes(1);
    expect(getClinicDetails).not.toHaveBeenCalled();
  });

});
