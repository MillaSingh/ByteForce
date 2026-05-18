jest.mock('../src/models/userModel', () => ({
  findUserByEmail: jest.fn()
}));

jest.mock('../src/services/firebaseService', () => ({
  verifyFirebaseToken: jest.fn()
}));

const { findUserByEmail } = require('../src/models/userModel');
const { verifyFirebaseToken } = require('../src/services/firebaseService');
const { loginUser } = require('../src/controllers/authController');

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginUser', () => {

  const fakeAdmin = {
    id: '1',
    email: 'admin@clinic.com',
    role: 'admin',
    clinicId: '42'
  };

  const fakeStaff = {
    id: '2',
    email: 'staff@clinic.com',
    role: 'staff',
    clinicId: '42'
  };

  const fakePatient = {
    id: '3',
    email: 'patient@clinic.com',
    role: 'patient',
    clinicId: null
  };

  test('returns user data and redirect path for a valid admin login', async () => {
    findUserByEmail.mockResolvedValueOnce(fakeAdmin);

    const req = mockReq({ email: 'admin@clinic.com', password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(findUserByEmail).toHaveBeenCalledWith('admin@clinic.com');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin', redirect: '/admin/dashboard' })
    );
  });

  test('returns user data and redirect path for a valid staff login', async () => {
    findUserByEmail.mockResolvedValueOnce(fakeStaff);

    const req = mockReq({ email: 'staff@clinic.com', password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(findUserByEmail).toHaveBeenCalledWith('staff@clinic.com');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'staff', redirect: '/staff/dashboard' })
    );
  });

  test('returns user data and redirect path for a valid patient login', async () => {
    findUserByEmail.mockResolvedValueOnce(fakePatient);

    const req = mockReq({ email: 'patient@clinic.com', password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(findUserByEmail).toHaveBeenCalledWith('patient@clinic.com');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'patient', redirect: '/patient/dashboard' })
    );
  });

  test('returns 400 when email is missing', async () => {
    const req = mockReq({ password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });

  test('returns 400 when password is missing', async () => {
    const req = mockReq({ email: 'admin@clinic.com' });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
  });

  test('returns 401 when user is not found', async () => {
    findUserByEmail.mockResolvedValueOnce(null);

    const req = mockReq({ email: 'ghost@clinic.com', password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  test('returns 500 when model throws', async () => {
    findUserByEmail.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ email: 'admin@clinic.com', password: 'password123' });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Login failed' });
  });

});
