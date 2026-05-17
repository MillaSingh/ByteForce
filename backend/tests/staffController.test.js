jest.mock('../src/models/staffModel', () => ({
  getStaffByClinic: jest.fn(),
  createStaffUser: jest.fn(),
  unassignStaff: jest.fn(),
  checkEmailExists: jest.fn()
}));

jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnValue({
    createUser: jest.fn()
  })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword')
}));

const staffModel = require('../src/models/staffModel');
const admin = require('firebase-admin');
const { getStaff, createStaff, unassignStaff } = require('../src/controllers/staffController');

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getStaff', () => {

  test('returns staff list for a clinic', async () => {
    const fakeStaff = [{ user_id: 1, first_name: 'Thabo', last_name: 'Nkosi' }];
    staffModel.getStaffByClinic.mockResolvedValueOnce(fakeStaff);

    const req = mockReq({}, { clinicId: '1' });
    const res = mockRes();

    await getStaff(req, res);

    expect(staffModel.getStaffByClinic).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ staff: fakeStaff });
  });

  test('returns 500 when model throws', async () => {
    staffModel.getStaffByClinic.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({}, { clinicId: '1' });
    const res = mockRes();

    await getStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch staff' });
  });

});

describe('createStaff', () => {

  const validBody = {
    firstName: 'Thabo',
    lastName: 'Nkosi',
    email: 'thabo@clinic.co.za',
    password: 'password123',
    jobTitle: 'Nurse',
    specialties: 'Cardiology',
    clinicId: '1'
  };

  test('creates staff account successfully', async () => {
    staffModel.checkEmailExists.mockResolvedValueOnce(false);
    admin.auth().createUser.mockResolvedValueOnce({ uid: 'firebase-uid-123' });
    staffModel.createStaffUser.mockResolvedValueOnce({ userId: 10 });

    const req = mockReq(validBody);
    const res = mockRes();

    await createStaff(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Staff account created successfully'
    });
  });

  test('returns 400 when required fields are missing', async () => {
    const req = mockReq({ firstName: 'Thabo' });
    const res = mockRes();

    await createStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'All required fields must be provided' });
  });

  test('returns 400 when email already exists', async () => {
    staffModel.checkEmailExists.mockResolvedValueOnce(true);

    const req = mockReq(validBody);
    const res = mockRes();

    await createStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'An account with this email already exists' });
  });

  test('returns 500 when Firebase account creation fails', async () => {
    staffModel.checkEmailExists.mockResolvedValueOnce(false);
    admin.auth().createUser.mockRejectedValueOnce(new Error('Firebase error'));

    const req = mockReq(validBody);
    const res = mockRes();

    await createStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

describe('unassignStaff', () => {

  test('unassigns staff member successfully', async () => {
    staffModel.unassignStaff.mockResolvedValueOnce({ updatedRow: 1 });

    const req = mockReq({}, { staffProfileId: '1', clinicId: '1' });
    const res = mockRes();

    await unassignStaff(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('returns 404 when staff not found at clinic', async () => {
    staffModel.unassignStaff.mockResolvedValueOnce({ updatedRow: 0 });

    const req = mockReq({}, { staffProfileId: '99999', clinicId: '1' });
    const res = mockRes();

    await unassignStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Staff member not found at this clinic' });
  });

  test('returns 500 when model throws', async () => {
    staffModel.unassignStaff.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({}, { staffProfileId: '1', clinicId: '1' });
    const res = mockRes();

    await unassignStaff(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to unassign staff member' });
  });

});