jest.mock('../src/models/operatingHoursModel', () => ({
  getOperatingHours: jest.fn(),
  saveOperatingHours: jest.fn()
}));

const { getOperatingHours, saveOperatingHours } = require('../src/models/operatingHoursModel');
const { getHours, updateHours } = require('../src/controllers/operatingHoursController');

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


describe('getHours', () => {

  test('returns operating hours for a clinic', async () => {
    const fakeHours = [
      { day_of_week: 'Monday', open_time: '08:00:00', close_time: '16:00:00', is_closed: false, slot_capacity: 3 }
    ];
    getOperatingHours.mockResolvedValueOnce(fakeHours);

    const req = mockReq({}, { id: '1' });
    const res = mockRes();

    await getHours(req, res);

    expect(getOperatingHours).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ hours: fakeHours });
  });

  test('returns 500 when model throws', async () => {
    getOperatingHours.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({}, { id: '1' });
    const res = mockRes();

    await getHours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch operating hours' });
  });

});


describe('updateHours', () => {

  const fakeHours = [
    { day_of_week: 'Monday', open_time: '08:00', close_time: '16:00', is_closed: false, slot_capacity: 3 },
    { day_of_week: 'Sunday', open_time: null, close_time: null, is_closed: true, slot_capacity: 0 }
  ];

  test('saves hours successfully and returns success', async () => {
    saveOperatingHours.mockResolvedValueOnce({ success: true });

    const req = mockReq({ hours: fakeHours }, { id: '1' });
    const res = mockRes();

    await updateHours(req, res);

    expect(saveOperatingHours).toHaveBeenCalledWith('1', fakeHours);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('returns 400 when hours array is missing', async () => {
    const req = mockReq({}, { id: '1' });
    const res = mockRes();

    await updateHours(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Hours array is required' });
  });

  test('returns 400 when hours is not an array', async () => {
    const req = mockReq({ hours: 'invalid' }, { id: '1' });
    const res = mockRes();

    await updateHours(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Hours array is required' });
  });

  test('returns 500 when model throws', async () => {
    saveOperatingHours.mockRejectedValueOnce(new Error('Database error'));

    const req = mockReq({ hours: fakeHours }, { id: '1' });
    const res = mockRes();

    await updateHours(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to save operating hours' });
  });

});