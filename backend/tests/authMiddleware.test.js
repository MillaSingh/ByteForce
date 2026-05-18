jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const pool = require("../src/db");

const { requireAuth } = require("../src/routes/authRoutes");

const mockReq = ({
  cookies = {},
  headers = {},
} = {}) => ({
  cookies,
  headers,
});

const mockRes = () => {
  const res = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);

  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireAuth middleware", () => {

  test("calls next when valid x-user-email exists", async () => {

    pool.query.mockResolvedValue({
      rows: [
        {
          user_id: 1,
          email: "test@clinic.com",
        },
      ],
    });

    const req = mockReq({
      headers: {
        "x-user-email": "test@clinic.com",
      },
    });

    const res = mockRes();

    await requireAuth(req, res, mockNext);

    await new Promise(process.nextTick);

    expect(pool.query).toHaveBeenCalledWith(
      `SELECT user_id, email FROM "user" WHERE email = $1`,
      ["test@clinic.com"]
    );

    expect(req.userEmail).toBe("test@clinic.com");

    expect(mockNext).toHaveBeenCalled();
  });

  test("returns 401 when email header is missing", async () => {

    const req = mockReq();

    const res = mockRes();

    await requireAuth(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized. Please log in.",
    });
  });

  test("returns 401 when user does not exist", async () => {

    pool.query.mockResolvedValue({
      rows: [],
    });

    const req = mockReq({
      headers: {
        "x-user-email": "ghost@clinic.com",
      },
    });

    const res = mockRes();

    await requireAuth(req, res, mockNext);

    await new Promise(process.nextTick);

    expect(mockNext).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(401);

    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized. Please log in.",
    });
  });

  test("returns 500 when database query fails", async () => {

    pool.query.mockRejectedValue(
      new Error("Database error")
    );

    const req = mockReq({
      headers: {
        "x-user-email": "test@clinic.com",
      },
    });

    const res = mockRes();

    await requireAuth(req, res, mockNext);

    await new Promise(process.nextTick);

    expect(mockNext).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      error: "Auth lookup failed.",
    });
  });

  test("calls next when valid firebaseToken cookie exists", async () => {

    const req = mockReq({
      cookies: {
        firebaseToken: "valid-cookie-token",
      },
    });

    const res = mockRes();

    await requireAuth(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

});
