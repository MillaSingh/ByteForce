jest.mock('../src/models/userModel', () => ({
  findUserByEmail: jest.fn(),
  updateUserPassword: jest.fn()
}));

jest.mock('../src/services/firebaseService', () => ({
  sendPasswordResetEmail: jest.fn(),
  updateFirebasePassword: jest.fn()
}));

const { findUserByEmail, updateUserPassword } = require('../src/models/userModel');
const { sendPasswordResetEmail, updateFirebasePassword } = require('../src/services/firebaseService');
const { forgotPassword, syncPassword } = require('../src/controllers/passwordController');

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

// ─── Forgot Password ──────────────────────────────────────────────────────────

describe('forgotPassword', () => {

  test('sends a reset email when a valid email is provided', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: '1', email: 'user@clinic.com' });
    sendPasswordResetEmail.mockResolvedValueOnce(true);

    const req = mockReq({ email: 'user@clinic.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(findUserByEmail).toHaveBeenCalledWith('user@clinic.com');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@clinic.com');
    expect(res.json).toHaveBeenCalledWith({ message: 'Password reset email sent' });
  });

  test('returns 400 when email is missing from request', async () => {
    const req = mockReq({});
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
  });

  test('returns 404 when email does not match any user', async () => {
    findUserByEmail.mockResolvedValueOnce(null);

    const req = mockReq({ email: 'ghost@clinic.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('returns 500 when Firebase reset email fails', async () => {
    findUserByEmail.mockResolvedValueOnce({ id: '1', email: 'user@clinic.com' });
    sendPasswordResetEmail.mockRejectedValueOnce(new Error('Firebase error'));

    const req = mockReq({ email: 'user@clinic.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send reset email' });
  });

  test('returns 500 when model throws during user lookup', async () => {
    findUserByEmail.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ email: 'user@clinic.com' });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send reset email' });
  });

});

// ─── Password Sync ────────────────────────────────────────────────────────────

describe('syncPassword', () => {

  test('syncs updated password to the database after Firebase update', async () => {
    updateFirebasePassword.mockResolvedValueOnce(true);
    updateUserPassword.mockResolvedValueOnce(true);

    const req = mockReq({ userId: '1', newPassword: 'newSecurePass1' });
    const res = mockRes();

    await syncPassword(req, res);

    expect(updateFirebasePassword).toHaveBeenCalledWith('1', 'newSecurePass1');
    expect(updateUserPassword).toHaveBeenCalledWith('1', 'newSecurePass1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
  });

  test('returns 400 when userId is missing', async () => {
    const req = mockReq({ newPassword: 'newSecurePass1' });
    const res = mockRes();

    await syncPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'userId and newPassword are required' });
  });

  test('returns 400 when newPassword is missing', async () => {
    const req = mockReq({ userId: '1' });
    const res = mockRes();

    await syncPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'userId and newPassword are required' });
  });

  test('returns 500 when Firebase password update fails', async () => {
    updateFirebasePassword.mockRejectedValueOnce(new Error('Firebase error'));

    const req = mockReq({ userId: '1', newPassword: 'newSecurePass1' });
    const res = mockRes();

    await syncPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password sync failed' });
  });

  test('returns 500 when database password update fails', async () => {
    updateFirebasePassword.mockResolvedValueOnce(true);
    updateUserPassword.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ userId: '1', newPassword: 'newSecurePass1' });
    const res = mockRes();

    await syncPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Password sync failed' });
  });

});
