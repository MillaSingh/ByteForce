jest.mock("firebase-admin", () => ({
  auth: () => ({
    verifyIdToken: jest.fn(),
    deleteUser: jest.fn(),
  }),
}));

jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const admin = require("firebase-admin");
const pool = require("../src/db");

const { deleteAccount } = require("../src/controllers/authController");

const mockReq = (headers = {}) => ({
  headers,
});

const mockRes = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);

  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("deleteAccount controller", () => {

  test("returns 401 when authorization header is missing", async () => {

    const req = mockReq();

    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  test("deletes account successfully", async () => {

    admin.auth().verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
    });

    admin.auth().deleteUser.mockResolvedValue();

    pool.query.mockResolvedValue({});

    const req = mockReq({
      authorization: "Bearer valid-token",
    });

    const res = mockRes();

    await deleteAccount(req, res);

    expect(admin.auth().verifyIdToken)
      .toHaveBeenCalledWith("valid-token");

    expect(pool.query).toHaveBeenCalledWith(
      `DELETE FROM "user" WHERE external_auth_id = $1`,
      ["firebase-uid-123"]
    );

    expect(admin.auth().deleteUser)
      .toHaveBeenCalledWith("firebase-uid-123");

    expect(res.clearCookie)
      .toHaveBeenCalledWith("firebaseToken");

    expect(res.json).toHaveBeenCalledWith({
      status: "Account deleted successfully",
    });
  });

  test("returns 500 when verifyIdToken fails", async () => {

    admin.auth().verifyIdToken.mockRejectedValue(
      new Error("Invalid token")
    );

    const req = mockReq({
      authorization: "Bearer invalid-token",
    });

    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid token",
    });
  });

  test("returns 500 when database delete fails", async () => {

    admin.auth().verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
    });

    pool.query.mockRejectedValue(
      new Error("Database error")
    );

    const req = mockReq({
      authorization: "Bearer valid-token",
    });

    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Database error",
    });
  });

  test("returns 500 when Firebase deleteUser fails", async () => {

    admin.auth().verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
    });

    pool.query.mockResolvedValue({});

    admin.auth().deleteUser.mockRejectedValue(
      new Error("Firebase delete failed")
    );

    const req = mockReq({
      authorization: "Bearer valid-token",
    });

    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Firebase delete failed",
    });
  });

});
