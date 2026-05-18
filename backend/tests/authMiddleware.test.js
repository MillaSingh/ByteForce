jest.mock('../src/models/userModel', () => ({
  findUserById: jest.fn()
}));

const { findUserById } = require('../src/models/userModel');
const { requireRole } = require('../src/middleware/authMiddleware');

const mockReq = (user = {}) => ({ user });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireRole middleware', () => {

  test('calls next() when user role matches required role', async () => {
    findUserById.mockResolvedValueOnce({ id: '1', role: 'admin' });

    const req = mockReq({ id: '1', role: 'admin' });
    const res = mockRes();

    await requireRole('admin')(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 403 when user role does not match required role', async () => {
    findUserById.mockResolvedValueOnce({ id: '2', role: 'staff' });

    const req = mockReq({ id: '2', role: 'staff' });
    const res = mockRes();

    await requireRole('admin')(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
  });

  test('returns 403 when a patient tries to access an admin dashboard', async () => {
    findUserById.mockResolvedValueOnce({ id: '3', role: 'patient' });

    const req = mockReq({ id: '3', role: 'patient' });
    const res = mockRes();

    await requireRole('admin')(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
  });

  test('returns 401 when no user is attached to the request', async () => {
    const req = { user: null };
    const res = mockRes();

    await requireRole('admin')(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  test('returns 500 when model throws during role lookup', async () => {
    findUserById.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ id: '1', role: 'admin' });
    const res = mockRes();

    await requireRole('admin')(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization check failed' });
  });

});
