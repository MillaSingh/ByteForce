jest.mock('../src/controllers/operatingHoursController', () => ({
  getHours: jest.fn((req, res) => res.json({ hours: [] })),
  updateHours: jest.fn((req, res) => res.json({ success: true }))
}));

const express = require('express');
const request = require('supertest');
const operatingHoursRouter = require('../src/routes/operatingHoursRoutes');
const { getHours, updateHours } = require('../src/controllers/operatingHoursController');

const app = express();
app.use(express.json());
app.use('/api/clinics', operatingHoursRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/clinics/:id/hours', () => {

  test('responds with 200 and calls getHours controller', async () => {
    const res = await request(app).get('/api/clinics/1/hours');

    expect(res.statusCode).toBe(200);
    expect(getHours).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/clinics/1/hours');

    expect(res.headers['content-type']).toMatch(/json/);
  });

});

describe('PATCH /api/clinics/:id/hours', () => {

  test('responds with 200 and calls updateHours controller', async () => {
    const res = await request(app).patch('/api/clinics/1/hours').send({
      hours: [
        { day_of_week: 'Monday', open_time: '08:00', close_time: '16:00', is_closed: false, slot_capacity: 3 }
      ]
    });

    expect(res.statusCode).toBe(200);
    expect(updateHours).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).patch('/api/clinics/1/hours').send({ hours: [] });

    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('does not call getHours when hitting PATCH route', async () => {
    await request(app).patch('/api/clinics/1/hours').send({ hours: [] });

    expect(getHours).not.toHaveBeenCalled();
    expect(updateHours).toHaveBeenCalledTimes(1);
  });

});