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
const { getOperatingHours, saveOperatingHours } = require('../src/models/operatingHoursModel');

beforeEach(() => {
  jest.clearAllMocks();
});


describe('getOperatingHours', () => {

  test('returns operating hours for a clinic', async () => {
    const fakeHours = [
      { hours_id: 1, day_of_week: 'Monday', open_time: '08:00:00', close_time: '16:00:00', is_closed: false, slot_capacity: 3 },
      { hours_id: 2, day_of_week: 'Tuesday', open_time: '08:00:00', close_time: '16:00:00', is_closed: false, slot_capacity: 3 },
      { hours_id: 7, day_of_week: 'Sunday', open_time: null, close_time: null, is_closed: true, slot_capacity: 0 }
    ];
    pool.query.mockResolvedValueOnce({ rows: fakeHours });

    const result = await getOperatingHours(1);

    expect(result).toHaveLength(3);
    expect(result[0].day_of_week).toBe('Monday');
    expect(result[2].is_closed).toBe(true);
  });

  test('returns empty array when no hours configured', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const result = await getOperatingHours(1);

    expect(result).toHaveLength(0);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));

    await expect(getOperatingHours(1)).rejects.toThrow('Database error');
  });

});


describe('saveOperatingHours', () => {

  const fakeHours = [
    { day_of_week: 'Monday', open_time: '08:00', close_time: '16:00', is_closed: false, slot_capacity: 3 },
    { day_of_week: 'Saturday', open_time: null, close_time: null, is_closed: true, slot_capacity: 0 }
  ];

  test('saves hours successfully and returns success', async () => {
    const mockClient = await pool.connect();
    mockClient.query.mockResolvedValue({});

    const result = await saveOperatingHours(1, fakeHours);

    expect(result).toEqual({ success: true });
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('rolls back transaction when query fails', async () => {
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({})  // BEGIN
      .mockRejectedValueOnce(new Error('Insert failed')); // first INSERT

    await expect(saveOperatingHours(1, fakeHours)).rejects.toThrow('Insert failed');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('releases client even when error occurs', async () => {
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Insert failed'));

    await expect(saveOperatingHours(1, fakeHours)).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalled();
  });

});