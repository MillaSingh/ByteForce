jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/db');
const { getAnalytics } = require('../src/models/adminDashboardModel');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAnalytics', () => {

  const mockResults = [
    { rows: [{ count: '5' }] },                          // todayResult
    { rows: [{ count: '50' }] },                         // totalResult
    { rows: [{ no_shows: '3', total_resolved: '40' }] }, // noShowResult
    { rows: [{ avg_wait: '25.5' }] },                    // waitResult
    { rows: [                                             // weeklyResult
      { day: '2026-05-10', count: '3' },
      { day: '2026-05-11', count: '5' }
    ]},
    { rows: [                                             // statusResult
      { status: 'completed', count: '30' },
      { status: 'confirmed', count: '10' },
      { status: 'cancelled', count: '5' },
      { status: 'pending', count: '5' }
    ]},
    { rows: [                                             // recentResult
      { appointment_id: 1, appointment_date: '2026-05-16', appointment_time: '08:00:00', status: 'confirmed', first_name: 'Thabo', last_name: 'Nkosi' }
    ]}
  ];

  test('returns all analytics fields', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);

    expect(result).toHaveProperty('appointmentsToday');
    expect(result).toHaveProperty('totalAppointments');
    expect(result).toHaveProperty('noShowRate');
    expect(result).toHaveProperty('avgWaitMinutes');
    expect(result).toHaveProperty('weeklyAppointments');
    expect(result).toHaveProperty('statusBreakdown');
    expect(result).toHaveProperty('recentAppointments');
  });

  test('calculates appointmentsToday correctly', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '8' }] })
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.appointmentsToday).toBe(8);
  });

  test('calculates noShowRate correctly', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce({ rows: [{ no_shows: '10', total_resolved: '50' }] })
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.noShowRate).toBe(20);
  });

  test('returns noShowRate of 0 when no resolved appointments', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce({ rows: [{ no_shows: '0', total_resolved: '0' }] })
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.noShowRate).toBe(0);
  });

  test('calculates avgWaitMinutes correctly', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce({ rows: [{ avg_wait: '30.7' }] })
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.avgWaitMinutes).toBe(31);
  });

  test('returns null avgWaitMinutes when no queue data', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce({ rows: [{ avg_wait: null }] })
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.avgWaitMinutes).toBeNull();
  });

  test('returns 7 days in weeklyAppointments', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.weeklyAppointments).toHaveLength(7);
  });

  test('fills missing days with 0 in weeklyAppointments', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    result.weeklyAppointments.forEach(day => {
      expect(day.count).toBe(0);
    });
  });

  test('returns correct statusBreakdown', async () => {
    pool.query
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])
      .mockResolvedValueOnce(mockResults[2])
      .mockResolvedValueOnce(mockResults[3])
      .mockResolvedValueOnce(mockResults[4])
      .mockResolvedValueOnce(mockResults[5])
      .mockResolvedValueOnce(mockResults[6]);

    const result = await getAnalytics(1);
    expect(result.statusBreakdown).toHaveLength(4);
    expect(result.statusBreakdown[0].status).toBe('completed');
    expect(result.statusBreakdown[0].count).toBe(30);
  });

  test('throws error when database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('Database error'));
    await expect(getAnalytics(1)).rejects.toThrow('Database error');
  });

});