jest.mock('../src/db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(mockClient)
  };
});

const pool = require('../src/db');
const {
  getStaffByClinic,
  createStaffUser,
  unassignStaff,
  checkEmailExists
} = require('../src/models/staffModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getStaffByClinic', () => {

  test('returns staff list for a clinic', async () => {
    const fakeStaff = [
      { user_id: 1, first_name: 'Thabo', last_name: 'Nkosi', email: 'thabo@clinic.co.za', job_title: 'Nurse', specialties: null }
    ];
    pool.query.mockResolvedValueOnce({ rows: fakeStaff });

    const result = await getStaffByClinic(1);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Thabo');
  });

  test('returns empty array when no staff assigned', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getStaffByClinic(1);
    expect(result).toHaveLength(0);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    await expect(getStaffByClinic(1)).rejects.toThrow('Database error');
  });

});

describe('checkEmailExists', () => {

  test('returns true when email exists', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    const result = await checkEmailExists('existing@email.com');
    expect(result).toBe(true);
  });

  test('returns false when email does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    const result = await checkEmailExists('new@email.com');
    expect(result).toBe(false);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    await expect(checkEmailExists('test@email.com')).rejects.toThrow('Database error');
  });

});

describe('unassignStaff', () => {

  test('returns rowCount of 1 when staff is unassigned', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });
    const result = await unassignStaff(1, 1);
    expect(result.updatedRow).toBe(1);
  });

  test('returns rowCount of 0 when staff not found', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    const result = await unassignStaff(99999, 1);
    expect(result.updatedRow).toBe(0);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    await expect(unassignStaff(1, 1)).rejects.toThrow('Database error');
  });

});

describe('createStaffUser', () => {

  test('creates staff user and profile successfully', async () => {
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ user_id: 10 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const result = await createStaffUser(
      'Thabo', 'Nkosi', 'thabo@clinic.co.za',
      'firebase-uid-123', 'hashedpassword',
      'Nurse', 'Cardiology', 1
    );

    expect(result).toHaveProperty('userId');
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('rolls back transaction when insert fails', async () => {
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Insert failed'));

    await expect(createStaffUser(
      'Thabo', 'Nkosi', 'thabo@clinic.co.za',
      'firebase-uid-123', 'hashedpassword',
      'Nurse', null, 1
    )).rejects.toThrow('Insert failed');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

});