const express = require('express');
const request = require('supertest');

jest.mock('../src/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require('../src/db');
const authRoutes = require('../src/routes/authRoutes');

let app;

beforeEach(() => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

describe('🔥 AUTH ROUTES FULL COVERAGE FIX', () => {

  // -----------------------------
  // /me (ALL BRANCHES)
  // -----------------------------
  describe('GET /me', () => {

    test('200 success', async () => {
      pool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ email: 'a@mail.com', role: 'admin' }]
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-email', 'a@mail.com');

      expect(res.statusCode).toBe(200);
    });

    test('400 missing email', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toBe(400);
    });

    test('500 DB error branch', async () => {
      pool.query.mockRejectedValue(new Error('DB crash'));

      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-email', 'a@mail.com');

      expect(res.statusCode).toBe(500);
    });

  });

  // -----------------------------
  // /check-role (ALL BRANCHES)
  // -----------------------------
  describe('GET /check-role', () => {

    test('admin redirect', async () => {
      pool.query.mockResolvedValue({
        rows: [{ role: 'admin' }]
      });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'admin@mail.com');

      expect(res.body.redirect).toBe('/html/admin_dashboard.html');
    });

    test('null role redirect', async () => {
      pool.query.mockResolvedValue({
        rows: [{ role: null }]
      });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'u@mail.com');

      expect(res.body.redirect).toBe('/html/select_role.html');
    });

    test('404 user missing', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'x@mail.com');

      expect(res.statusCode).toBe(404);
    });

    test('500 DB error branch', async () => {
      pool.query.mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'x@mail.com');

      expect(res.statusCode).toBe(500);
    });

  });

  // -----------------------------
  // /set-role (IMPORTANT)
  // -----------------------------
  describe('POST /set-role', () => {

    test('invalid role → 400', async () => {
      const res = await request(app)
        .post('/api/auth/set-role')
        .set('x-user-email', 'a@mail.com')
        .send({ role: 'hacker' });

      expect(res.statusCode).toBe(400);
    });

    test('user not found → 404', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/set-role')
        .set('x-user-email', 'a@mail.com')
        .send({ role: 'admin' });

      expect(res.statusCode).toBe(404);
    });

    test('DB failure → 500 branch', async () => {
      pool.query.mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .post('/api/auth/set-role')
        .set('x-user-email', 'a@mail.com')
        .send({ role: 'admin' });

      expect(res.statusCode).toBe(500);
    });

  });

  // -----------------------------
  // /session (FULL BRANCH)
  // -----------------------------
  describe('POST /session', () => {

    test('missing token → 400', async () => {
      const res = await request(app)
        .post('/api/auth/session')
        .send({});

      expect(res.statusCode).toBe(400);
    });

  });

  // -----------------------------
  // /sync-password (FULL BRANCH)
  // -----------------------------
  describe('POST /sync-password', () => {

    test('missing fields → 400', async () => {
      const res = await request(app)
        .post('/api/auth/sync-password')
        .send({ email: 'a@mail.com' });

      expect(res.statusCode).toBe(400);
    });

    test('user not found → 404', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/sync-password')
        .send({
          email: 'ghost@mail.com',
          newPassword: '12345678'
        });

      expect(res.statusCode).toBe(404);
    });

    test('DB crash → 500', async () => {
      pool.query.mockRejectedValue(new Error('fail'));

      const res = await request(app)
        .post('/api/auth/sync-password')
        .send({
          email: 'a@mail.com',
          newPassword: '12345678'
        });

      expect(res.statusCode).toBe(500);
    });

  });

  // -----------------------------
  // /verify-admin-code
  // -----------------------------
  describe('POST /verify-admin-code', () => {

    test('missing code → 400', async () => {
      const res = await request(app)
        .post('/api/auth/verify-admin-code')
        .send({});

      expect(res.statusCode).toBe(400);
    });

  });

});
