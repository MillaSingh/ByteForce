jest.mock('../src/models/userModel', () => ({
  createUser: jest.fn()
}));

jest.mock('../src/services/firebaseService', () => ({
  createFirebaseUser: jest.fn()
}));

const { createUser } = require('../src/models/userModel');
const { createFirebaseUser } = require('../src/services/firebaseService');
const { registerUser } = require('../src/controllers/registrationController');

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

describe('registerUser', () => {

  const fakeAdminPayload = {
    email: 'newadmin@clinic.com',
    password: 'securePass1',
    role: 'admin',
    clinicId: '42'
  };

  const fakeStaffPayload = {
    email: 'newstaff@clinic.com',
    password: 'securePass2',
    role: 'staff',
    clinicId: '42'
  };

  const fakePatientPayload = {
    email: 'newpatient@clinic.com',
    password: 'securePass3',
    role: 'patient'
  };

  test('successfully registers an admin user and returns redirect path', async () => {
    createFirebaseUser.mockResolvedValueOnce({ uid: 'firebase-uid-1' });
    createUser.mockResolvedValueOnce({ id: '10', ...fakeAdminPayload });

    const req = mockReq(fakeAdminPayload);
    const res = mockRes();

    await registerUser(req, res);

    expect(createFirebaseUser).toHaveBeenCalledWith('newadmin@clinic.com', 'securePass1');
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: '/admin/dashboard' })
    );
  });

  test('successfully registers a staff user and returns redirect path', async () => {
    createFirebaseUser.mockResolvedValueOnce({ uid: 'firebase-uid-2' });
    createUser.mockResolvedValueOnce({ id: '11', ...fakeStaffPayload });

    const req = mockReq(fakeStaffPayload);
    const res = mockRes();

    await registerUser(req, res);

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'staff' }));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: '/staff/dashboard' })
    );
  });

  test('successfully registers a patient user and returns redirect path', async () => {
    createFirebaseUser.mockResolvedValueOnce({ uid: 'firebase-uid-3' });
    createUser.mockResolvedValueOnce({ id: '12', ...fakePatientPayload });

    const req = mockReq(fakePatientPayload);
    const res = mockRes();

    await registerUser(req, res);

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'patient' }));
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ redirect: '/patient/dashboard' })
    );
  });

  test('returns 400 when email is missing', async () => {
    const req = mockReq({ password: 'pass', role: 'admin', clinicId: '42' });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email, password, and role are required' });
  });

  test('returns 400 when role is missing', async () => {
    const req = mockReq({ email: 'user@clinic.com', password: 'pass' });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email, password, and role are required' });
  });

  test('returns 400 when role is invalid', async () => {
    const req = mockReq({ email: 'user@clinic.com', password: 'pass', role: 'superuser' });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid role specified' });
  });

  test('returns 500 when Firebase user creation fails', async () => {
    createFirebaseUser.mockRejectedValueOnce(new Error('Firebase error'));

    const req = mockReq(fakeAdminPayload);
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
  });

  test('returns 500 when database user creation fails', async () => {
    createFirebaseUser.mockResolvedValueOnce({ uid: 'firebase-uid-1' });
    createUser.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq(fakeAdminPayload);
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
  });

});
