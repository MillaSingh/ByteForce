// account.test.js

jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  })),
}));

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
    __mockPool: mockPool,
  };
});

const admin = require("firebase-admin");
const pg = require("pg");
const { deleteAccount } = require("../src/controllers/authController.js");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("Delete Account Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 401 if authorization header is missing", async () => {
    const req = {
      headers: {},
      body: {},
    };

    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  test("should return 401 if authorization header is not a Bearer token", async () => {
    const req = {
      headers: {
        authorization: "Invalid token",
      },
      body: {},
    };

    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  test("should delete account successfully when token is valid", async () => {
    const req = {
      headers: {
        authorization: "Bearer fake-token",
      },
      body: {},
    };

    const res = mockResponse();

    admin.auth().verifyIdToken.mockResolvedValue({
      uid: "firebase-user-123",
    });

    pg.__mockPool.query.mockResolvedValue({ rowCount: 1 });

    admin.auth().deleteUser.mockResolvedValue();

    await deleteAccount(req, res);

    expect(admin.auth().verifyIdToken).toHaveBeenCalledWith("fake-token");

    expect(pg.__mockPool.query).toHaveBeenCalledWith(
      `DELETE FROM "user" WHERE external_auth_id = $1`,
      ["firebase-user-123"]
    );

    expect(admin.auth().deleteUser).toHaveBeenCalledWith("firebase-user-123");

    expect(res.clearCookie).toHaveBeenCalledWith("firebaseToken");

    expect(res.json).toHaveBeenCalledWith({
      status: "Account deleted successfully",
    });
  });

  test("should return 500 if Firebase or database deletion fails", async () => {
    const req = {
      headers: {
        authorization: "Bearer fake-token",
      },
      body: {},
    };

    const res = mockResponse();

    admin.auth().verifyIdToken.mockRejectedValue(new Error("Invalid token"));

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token",
    });
  });
});