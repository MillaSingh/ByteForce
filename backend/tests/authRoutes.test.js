jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/db');
const router = require('../src/routes/authRoutes');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn();
  res.clearCookie = jest.fn();
  return res;
};

const getRouteHandler = (path) => {
  const layer = router.stack.find(l => l.route?.path === path);
  return layer?.route?.stack[0]?.handle;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authRoutes - /me', () => {

  test('returns user data', async () => {
    pool.query.mockResolvedValue({
      rowCount: 1,
      rows: [{
        user_id: 1,
        email: 'test@mail.com',
        role: 'admin'
      }]
    });

    const handler = getRouteHandler('/me');

    const req = {
      headers: { 'x-user-email': 'test@mail.com' }
    };

    const res = mockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('returns 400 when email missing', async () => {
    const handler = getRouteHandler('/me');

    const req = { headers: {} };
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});

describe('authRoutes - /check-role', () => {

  test('redirects to dashboard when role exists', async () => {
    pool.query.mockResolvedValue({
      rows: [{ role: 'admin' }]
    });

    const handler = getRouteHandler('/check-role');

    const req = { headers: { 'x-user-email': 'a@mail.com' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: '/html/admin_dashboard.html'
      })
    );
  });

  test('redirects to select_role when role is null', async () => {
    pool.query.mockResolvedValue({
      rows: [{ role: null }]
    });

    const handler = getRouteHandler('/check-role');

    const req = { headers: { 'x-user-email': 'a@mail.com' } };
    const res = mockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: '/html/select_role.html'
      })
    );
  });

});

describe('authRoutes - /set-role', () => {

  test('returns 400 for invalid role', async () => {
    const handler = getRouteHandler('/set-role');

    const req = {
      body: { role: 'invalid' },
      headers: { 'x-user-email': 'test@mail.com' }
    };

    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});

describe('authRoutes - /session', () => {

  test('returns 400 when idToken missing', async () => {
    const layer = router.stack.find(l => l.route?.path === '/session');
    const handler = layer.route.stack[0].handle;

    const req = { body: {} };
    const res = mockRes();

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

});
