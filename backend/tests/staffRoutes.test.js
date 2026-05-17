jest.mock('../src/controllers/staffController', () => ({
  getStaff: jest.fn((req, res) => res.json({ staff: [] })),
  createStaff: jest.fn((req, res) => res.json({ success: true, message: 'Staff account created successfully' })),
  unassignStaff: jest.fn((req, res) => res.json({ success: true }))
}));

const express = require('express');
const request = require('supertest');
const staffRouter = require('../src/routes/staffRoutes');
const { getStaff, createStaff, unassignStaff } = require('../src/controllers/staffController');

const app = express();
app.use(express.json());
app.use('/api/staff', staffRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/staff/:clinicId', () => {

  test('responds with 200 and calls getStaff controller', async () => {
    const res = await request(app).get('/api/staff/1');
    expect(res.statusCode).toBe(200);
    expect(getStaff).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/staff/1');
    expect(res.headers['content-type']).toMatch(/json/);
  });

});

describe('POST /api/staff', () => {

  test('responds with 200 and calls createStaff controller', async () => {
    const res = await request(app).post('/api/staff').send({
      firstName: 'Thabo',
      lastName: 'Nkosi',
      email: 'thabo@clinic.co.za',
      password: 'password123',
      jobTitle: 'Nurse',
      clinicId: '1'
    });
    expect(res.statusCode).toBe(200);
    expect(createStaff).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).post('/api/staff').send({});
    expect(res.headers['content-type']).toMatch(/json/);
  });

});

describe('PATCH /api/staff/:staffProfileId/unassign/:clinicId', () => {

  test('responds with 200 and calls unassignStaff controller', async () => {
    const res = await request(app).patch('/api/staff/1/unassign/1');
    expect(res.statusCode).toBe(200);
    expect(unassignStaff).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).patch('/api/staff/1/unassign/1');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('does not call getStaff when hitting unassign route', async () => {
    await request(app).patch('/api/staff/1/unassign/1');
    expect(getStaff).not.toHaveBeenCalled();
    expect(unassignStaff).toHaveBeenCalledTimes(1);
  });

});