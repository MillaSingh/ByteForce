jest.mock("../src/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");

const pool = require("../src/db");
const bcrypt = require("bcrypt");

const authRoutes = require("../src/routes/authRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Auth Routes", () => {

  // ─────────────────────────────────────────
  // SESSION ROUTES
  // ─────────────────────────────────────────

  test("POST /session stores token successfully", async () => {

    const response = await request(app)
      .post("/api/auth/session")
      .send({
        idToken: "valid-token",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
    });
  });

  test("POST /session returns 400 when token missing", async () => {

    const response = await request(app)
      .post("/api/auth/session")
      .send({});

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "idToken required",
    });
  });

  test("DELETE /session clears cookie", async () => {

    const response = await request(app)
      .delete("/api/auth/session");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
    });
  });

  // ─────────────────────────────────────────
  // REGISTER ROUTE
  // ─────────────────────────────────────────

  test("POST /register creates new user", async () => {

    pool.query
      .mockResolvedValueOnce({
        rowCount: 0,
      })
      .mockResolvedValueOnce({});

    bcrypt.hash.mockResolvedValue("hashed-password");

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        uid: "firebase-uid",
        firstName: "Safiyyah",
        lastName: "Saloojee",
        email: "test@clinic.com",
        role: "patient",
        password: "password123",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      isNewUser: true,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith(
      "password123",
      10
    );
  });

  test("POST /register returns existing user", async () => {

    pool.query.mockResolvedValueOnce({
      rowCount: 1,
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        uid: "firebase-uid",
        email: "existing@clinic.com",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      isNewUser: false,
    });
  });

  test("POST /register returns 400 when uid missing", async () => {

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@clinic.com",
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "uid and email are required",
    });
  });

  test("POST /register returns 500 on DB failure", async () => {

    pool.query.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        uid: "firebase-uid",
        email: "test@clinic.com",
      });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      error: "Failed to register user",
    });
  });

  // ─────────────────────────────────────────
  // /me ROUTE
  // ─────────────────────────────────────────

  test("GET /me returns user profile", async () => {

    pool.query.mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          email: "test@clinic.com",
          role: "patient",
        },
      ],
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("x-user-email", "test@clinic.com");

    expect(response.status).toBe(200);

    expect(response.body.email).toBe(
      "test@clinic.com"
    );
  });

  test("GET /me returns 400 when email missing", async () => {

    const response = await request(app)
      .get("/api/auth/me");

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "Email required",
    });
  });

  test("GET /me returns 404 when user missing", async () => {

    pool.query.mockResolvedValue({
      rowCount: 0,
      rows: [],
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("x-user-email", "ghost@clinic.com");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: "User not found",
    });
  });

  // ─────────────────────────────────────────
  // CHECK ROLE
  // ─────────────────────────────────────────

  test("GET /check-role returns patient redirect", async () => {

    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 1,
            email: "patient@clinic.com",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            role: "patient",
          },
        ],
      });

    const response = await request(app)
      .get("/api/auth/check-role")
      .set("x-user-email", "patient@clinic.com");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      role: "patient",
      redirect: "/html/home.html",
    });
  });

  test("GET /check-role returns select_role redirect when role null", async () => {

    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            user_id: 1,
            email: "new@clinic.com",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            role: null,
          },
        ],
      });

    const response = await request(app)
      .get("/api/auth/check-role")
      .set("x-user-email", "new@clinic.com");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      role: null,
      redirect: "/html/select_role.html",
    });
  });

  // ─────────────────────────────────────────
  // VERIFY ADMIN CODE
  // ─────────────────────────────────────────

  test("POST /verify-admin-code accepts valid code", async () => {

    process.env.ADMIN_INVITE_CODE = "SECRET123";

    pool.query.mockResolvedValue({
      rows: [
        {
          user_id: 1,
          email: "admin@clinic.com",
        },
      ],
    });

    const response = await request(app)
      .post("/api/auth/verify-admin-code")
      .set("x-user-email", "admin@clinic.com")
      .send({
        code: "SECRET123",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Code accepted.",
    });
  });

  test("POST /verify-admin-code rejects invalid code", async () => {

    process.env.ADMIN_INVITE_CODE = "SECRET123";

    pool.query.mockResolvedValue({
      rows: [
        {
          user_id: 1,
          email: "admin@clinic.com",
        },
      ],
    });

    const response = await request(app)
      .post("/api/auth/verify-admin-code")
      .set("x-user-email", "admin@clinic.com")
      .send({
        code: "WRONGCODE",
      });

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      error: "Invalid invite code. Contact your administrator.",
    });
  });

});
