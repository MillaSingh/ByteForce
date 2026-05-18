jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn()
  })
}));

jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const admin = require('firebase-admin');
const pool = require('../src/db');
const { deleteAccount } = require('../src/controllers/authController');

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn();
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deleteAccount', () => {

  test('successfully deletes account', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({ uid: '123
