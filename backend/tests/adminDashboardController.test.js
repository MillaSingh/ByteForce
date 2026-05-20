jest.mock('../src/models/adminDashboardModel', () => ({
  getAnalytics: jest.fn()
}));

const { getAnalytics } = require('../src/models/adminDashboardModel');
const { getClinicAnalytics } = require('../src/controllers/adminDashboardController');

const mockReq = (params = {}) => ({ params });
const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getClinicAnalytics', () => {

  const fakeData = {
    appointmentsToday: 5,
    totalAppointments: 50,
    noShowRate: 10,
    avgWaitMinutes: 25,
    weeklyAppointments: [],
    statusBreakdown: [],
    recentAppointments: []
  };

  test('returns analytics data for a valid clinic', async () => {
    getAnalytics.mockResolvedValueOnce(fakeData);

    const req = mockReq({ clinicId: '1' });
    const res = mockRes();

    await getClinicAnalytics(req, res);

    expect(getAnalytics).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith(fakeData);
  });

  test('returns 400 when clinicId is missing', async () => {
    const req = mockReq({});
    const res = mockRes();

    await getClinicAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'clinicId is required' });
  });

  test('returns 500 when model throws', async () => {
    getAnalytics.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ clinicId: '1' });
    const res = mockRes();

    await getClinicAnalytics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch analytics' });
  });

});