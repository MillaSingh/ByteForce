const express = require('express');
const request = require('supertest');

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/db');

// import router AFTER mocks
const authRoutes = require('../src/routes/authRoutes');

let app;

beforeEach(() => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

describe('AUTH ROUTES FULL COVERAGE', () => {

  // -----------------------------
  // /me
  // -----------------------------
  describe('GET /api/auth/me', () => {

    test('returns user when email exists', async () => {
      pool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{
          user_id: 1,
          email: 'test@mail.com',
          role: 'admin'
        }]
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-email', 'test@mail.com');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@mail.com');
    });

    test('returns 400 when email missing', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email required');
    });

    test('returns 404 when user not found', async () => {
      pool.query.mockResolvedValue({
        rowCount: 0,
        rows: []
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-email', 'ghost@mail.com');

      expect(res.status).toBe(404);
    });

  });

  // -----------------------------
  // /check-role
  // -----------------------------
  describe('GET /api/auth/check-role', () => {

    test('returns redirect for admin', async () => {
      pool.query.mockResolvedValue({
        rows: [{ role: 'admin' }]
      });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'admin@mail.com');

      expect(res.status).toBe(200);
      expect(res.body.redirect).toBe('/html/admin_dashboard.html');
    });

    test('returns select_role when role is null', async () => {
      pool.query.mockResolvedValue({
        rows: [{ role: null }]
      });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'user@mail.com');

      expect(res.body.redirect).toBe('/html/select_role.html');
    });

    test('returns 404 when user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/api/auth/check-role')
        .set('x-user-email', 'ghost@mail.com');

      expect(res.status).toBe(404);
    });

  });

  // -----------------------------
  // /set-role
  // -----------------------------
  describe('POST /api/auth/set-role', () => {

    test('rejects invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/set-role')
        .set('x-user-email', 'test@mail.com')
        .send({ role: 'hacker' });

      expect(res.status).toBe(400);
    });

    test('returns 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/set-role')
        .set('x-user-email', 'test@mail.com')
        .send({ role: 'admin' });

      expect(res.status).toBe(404);
    });

  });

  // -----------------------------
  // /session
  // -----------------------------
  describe('POST /api/auth/session', () => {

    test('returns 400 when token missing', async () => {
      const res = await request(app)
        .post('/api/auth/session')
        .send({});

      expect(res.status).toBe(400);
    });

  });

  // -----------------------------
  // /sync-password
  // -----------------------------
  describe('POST /api/auth/sync-password', () => {

    test('returns 400 when fields missing', async () => {
      const res = await request(app)
        .post('/api/auth/sync-password')
        .send({ email: 'a@mail.com' });

      expect(res.status).toBe(400);
    });

    test('returns 404 when user not found', async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/sync-password')
        .send({
          email: 'ghost@mail.com',
          newPassword: '12345678'
        });

      expect(res.status).toBe(404);
    });

  });

  // -----------------------------
  // /verify-admin-code
  // -----------------------------
  describe('POST /api/auth/verify-admin-code', () => {

    test('returns 400 when code missing', async () => {
      const res = await request(app)
        .post('/api/auth/verify-admin-code')
        .send({});

      expect(res.status).toBe(400);
    });

  });

});
