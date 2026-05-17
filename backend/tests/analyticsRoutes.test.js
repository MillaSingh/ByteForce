jest.mock('../src/controllers/adminDashboardController', () => ({
  getClinicAnalytics: jest.fn((req, res) => res.json({
    appointmentsToday: 5,
    totalAppointments: 50,
    noShowRate: 10,
    avgWaitMinutes: 25,
    weeklyAppointments: [],
    statusBreakdown: [],
    recentAppointments: []
  }))
}));

const express = require('express');
const request = require('supertest');
const analyticsRouter = require('../src/routes/analyticsRoutes');
const { getClinicAnalytics } = require('../src/controllers/adminDashboardController');

const app = express();
app.use(express.json());
app.use('/api/dashboard/analytics', analyticsRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/dashboard/analytics/:clinicId', () => {

  test('responds with 200 and calls getClinicAnalytics', async () => {
    const res = await request(app).get('/api/dashboard/analytics/1');
    expect(res.statusCode).toBe(200);
    expect(getClinicAnalytics).toHaveBeenCalledTimes(1);
  });

  test('returns JSON response', async () => {
    const res = await request(app).get('/api/dashboard/analytics/1');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('returns analytics data', async () => {
    const res = await request(app).get('/api/dashboard/analytics/1');
    expect(res.body).toHaveProperty('appointmentsToday');
    expect(res.body).toHaveProperty('totalAppointments');
    expect(res.body).toHaveProperty('noShowRate');
    expect(res.body).toHaveProperty('weeklyAppointments');
    expect(res.body).toHaveProperty('statusBreakdown');
    expect(res.body).toHaveProperty('recentAppointments');
  });

});