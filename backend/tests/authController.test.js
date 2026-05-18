jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn()
  };
  return {
    auth: jest.fn().mockReturnValue(mockAuth)
  };
});

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const admin = require('firebase-admin');
const pool = require('../src/db');
const { deleteAccount } = require('../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.clearCookie = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deleteAccount controller', () => {

  test('successfully deletes user account', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-123' });
    admin.auth().deleteUser.mockResolvedValue(true);
    pool.query.mockResolvedValue({});

    const req = {
      headers: { authorization: 'Bearer valid-token' }
    };
    const res = mockRes();

    await deleteAccount(req, res);

    expect(admin.auth().verifyIdToken).toHaveBeenCalled();
    expect(pool.query).toHaveBeenCalled();
    expect(admin.auth().deleteUser).toHaveBeenCalledWith('uid-123');
    expect(res.json).toHaveBeenCalledWith({ status: 'Account deleted successfully' });
  });

  test('returns 401 when no authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('returns 401 when authorization does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic sometoken' } };
    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 500 when Firebase verification fails', async () => {
    admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('returns 500 when database query fails', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: 'uid-123' });
    pool.query.mockRejectedValue(new Error('Database error'));

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});