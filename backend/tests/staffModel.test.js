jest.mock('../src/db', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  return {
    query: jest.fn(),
    connect: jest.fn(),
    __mockClient: mockClient
  };
});

const pool = require('../src/db');

const {
  getStaffByClinic,
  createStaffProfile,
  createStaffUser,
  unassignStaff,
  checkEmailExists
} = require('../src/models/staffModel');

const mockClient = pool.__mockClient;

beforeEach(() => {
  pool.query.mockReset();
  pool.connect.mockReset();

  mockClient.query.mockReset();
  mockClient.release.mockReset();

  pool.connect.mockResolvedValue(mockClient);
});

describe('getStaffByClinic', () => {

  test('returns staff list for a clinic', async () => {
    const fakeStaff = [
      {
        user_id: 1,
        first_name: 'Thabo',
        last_name: 'Nkosi',
        email: 'thabo@clinic.co.za',
        role: 'staff',
        staff_profile_id: 5,
        job_title: 'Nurse',
        specialties: null
      }
    ];

    pool.query.mockResolvedValueOnce({ rows: fakeStaff });

    const result = await getStaffByClinic(1);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toBe('Thabo');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT u.user_id'),
      [1]
    );
  });

  test('returns empty array when no staff assigned', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getStaffByClinic(1);

    expect(result).toEqual([]);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(getStaffByClinic(1)).rejects.toThrow('Database error');
  });

});

describe('createStaffProfile', () => {

  test('creates staff profile successfully', async () => {
    const fakeProfile = {
      staff_profile_id: 1,
      user_id: 10,
      clinic_id: 2,
      job_title: 'Doctor',
      specialties: 'Paediatrics'
    };

    pool.query.mockResolvedValueOnce({
      rows: [fakeProfile]
    });

    const result = await createStaffProfile(
      10,
      2,
      'Doctor',
      'Paediatrics'
    );

    expect(result).toEqual(fakeProfile);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO staff_profile'),
      [10, 2, 'Doctor', 'Paediatrics']
    );
  });

  test('sets specialties to null when not provided', async () => {
    const fakeProfile = {
      staff_profile_id: 1,
      user_id: 10,
      clinic_id: 2,
      job_title: 'Doctor',
      specialties: null
    };

    pool.query.mockResolvedValueOnce({
      rows: [fakeProfile]
    });

    const result = await createStaffProfile(
      10,
      2,
      'Doctor',
      null
    );

    expect(result.specialties).toBeNull();
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO staff_profile'),
      [10, 2, 'Doctor', null]
    );
  });

  test('throws error when create profile query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      createStaffProfile(10, 2, 'Doctor', 'Paediatrics')
    ).rejects.toThrow('Database error');
  });

});

describe('checkEmailExists', () => {

  test('returns true when email exists', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await checkEmailExists('existing@email.com');

    expect(result).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT user_id FROM "user"'),
      ['existing@email.com']
    );
  });

  test('returns false when email does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const result = await checkEmailExists('new@email.com');

    expect(result).toBe(false);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      checkEmailExists('test@email.com')
    ).rejects.toThrow('Database error');
  });

});

describe('unassignStaff', () => {

  test('returns rowCount of 1 when staff is unassigned', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const result = await unassignStaff(1, 1);

    expect(result.updatedRow).toBe(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE staff_profile SET clinic_id = NULL'),
      [1, 1]
    );
  });

  test('returns rowCount of 0 when staff not found', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });

    const result = await unassignStaff(99999, 1);

    expect(result.updatedRow).toBe(0);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(
      unassignStaff(1, 1)
    ).rejects.toThrow('Database error');
  });

});

describe('createStaffUser', () => {

  test('creates staff user and profile successfully', async () => {
    mockClient.query
      // BEGIN
      .mockResolvedValueOnce({})
      // INSERT INTO "user"
      .mockResolvedValueOnce({
        rows: [{ user_id: 10 }]
      })
      // INSERT INTO staff_profile
      .mockResolvedValueOnce({})
      // COMMIT
      .mockResolvedValueOnce({});

    const result = await createStaffUser(
      'Thabo',
      'Nkosi',
      'thabo@clinic.co.za',
      'firebase-uid-123',
      'hashedpassword',
      'Nurse',
      'Cardiology',
      1
    );

    expect(result).toEqual({ userId: 10 });

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "user"'),
      [
        'Thabo',
        'Nkosi',
        'thabo@clinic.co.za',
        'firebase-uid-123',
        'hashedpassword'
      ]
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO staff_profile'),
      [10, 1, 'Nurse', 'Cardiology']
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('sets specialties to null when creating staff user without specialties', async () => {
    mockClient.query
      // BEGIN
      .mockResolvedValueOnce({})
      // INSERT INTO "user"
      .mockResolvedValueOnce({
        rows: [{ user_id: 10 }]
      })
      // INSERT INTO staff_profile
      .mockResolvedValueOnce({})
      // COMMIT
      .mockResolvedValueOnce({});

    const result = await createStaffUser(
      'Thabo',
      'Nkosi',
      'thabo@clinic.co.za',
      'firebase-uid-123',
      'hashedpassword',
      'Nurse',
      null,
      1
    );

    expect(result).toEqual({ userId: 10 });

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO staff_profile'),
      [10, 1, 'Nurse', null]
    );
  });

  test('rolls back transaction when user insert fails', async () => {
    mockClient.query
      // BEGIN
      .mockResolvedValueOnce({})
      // INSERT INTO "user" fails
      .mockRejectedValueOnce(new Error('Insert failed'))
      // ROLLBACK
      .mockResolvedValueOnce({});

    await expect(
      createStaffUser(
        'Thabo',
        'Nkosi',
        'thabo@clinic.co.za',
        'firebase-uid-123',
        'hashedpassword',
        'Nurse',
        null,
        1
      )
    ).rejects.toThrow('Insert failed');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

  test('rolls back transaction when staff profile insert fails', async () => {
    mockClient.query
      // BEGIN
      .mockResolvedValueOnce({})
      // INSERT INTO "user"
      .mockResolvedValueOnce({
        rows: [{ user_id: 10 }]
      })
      // INSERT INTO staff_profile fails
      .mockRejectedValueOnce(new Error('Profile insert failed'))
      // ROLLBACK
      .mockResolvedValueOnce({});

    await expect(
      createStaffUser(
        'Thabo',
        'Nkosi',
        'thabo@clinic.co.za',
        'firebase-uid-123',
        'hashedpassword',
        'Nurse',
        'Cardiology',
        1
      )
    ).rejects.toThrow('Profile insert failed');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalledTimes(1);
  });

});