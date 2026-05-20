const express = require("express");
const request = require("supertest");

jest.mock("../src/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require("../src/db");
const authRoutes = require("../src/routes/authRoutes");

let app;

beforeEach(() => {
  jest.clearAllMocks();

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
});

describe("🔥 AUTH ROUTES FULL COVERAGE FIX", () => {
  // -----------------------------
  // /me
  // -----------------------------
  describe("GET /me", () => {
    test("200 success", async () => {
      pool.query.mockResolvedValue({
        rowCount: 1,
        rows: [{ email: "a@mail.com", role: "admin" }],
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("x-user-email", "a@mail.com");

      expect(res.statusCode).toBe(200);
    });

    test("400 missing email", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.statusCode).toBe(400);
    });

    test("500 DB error branch", async () => {
      pool.query.mockRejectedValue(new Error("DB crash"));

      const res = await request(app)
        .get("/api/auth/me")
        .set("x-user-email", "a@mail.com");

      expect(res.statusCode).toBe(500);
    });
  });

  // -----------------------------
  // /check-role
  // -----------------------------
  describe("GET /check-role", () => {
    test("admin redirect", async () => {
      pool.query
        // requireAuth lookup
        .mockResolvedValueOnce({
          rows: [{ user_id: 1, email: "admin@mail.com" }],
        })
        // check-role route lookup
        .mockResolvedValueOnce({
          rows: [{ role: "admin" }],
        });

      const res = await request(app)
        .get("/api/auth/check-role")
        .set("x-user-email", "admin@mail.com");

      expect(res.statusCode).toBe(200);
      expect(res.body.redirect).toBe("/html/admin_dashboard.html");
    });

    test("null role redirect", async () => {
      pool.query
        // requireAuth lookup
        .mockResolvedValueOnce({
          rows: [{ user_id: 1, email: "u@mail.com" }],
        })
        // check-role route lookup
        .mockResolvedValueOnce({
          rows: [{ role: null }],
        });

      const res = await request(app)
        .get("/api/auth/check-role")
        .set("x-user-email", "u@mail.com");

      expect(res.statusCode).toBe(200);
      expect(res.body.redirect).toBe("/html/select_role.html");
    });

    test("404 user missing inside route", async () => {
      pool.query
        // requireAuth passes first
        .mockResolvedValueOnce({
          rows: [{ user_id: 1, email: "x@mail.com" }],
        })
        // actual check-role route returns no user
        .mockResolvedValueOnce({
          rows: [],
        });

      const res = await request(app)
        .get("/api/auth/check-role")
        .set("x-user-email", "x@mail.com");

      expect(res.statusCode).toBe(404);
    });

    test("401 unauthorized when requireAuth cannot find user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get("/api/auth/check-role")
        .set("x-user-email", "missing@mail.com");

      expect(res.statusCode).toBe(401);
    });

    test("500 DB error branch", async () => {
      pool.query.mockRejectedValue(new Error("fail"));

      const res = await request(app)
        .get("/api/auth/check-role")
        .set("x-user-email", "x@mail.com");

      expect(res.statusCode).toBe(500);
    });
  });

  // -----------------------------
  // /set-role
  // -----------------------------
  describe("POST /set-role", () => {
    test("invalid role → 400", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ user_id: 1, email: "a@mail.com" }],
      });

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({ role: "hacker" });

      expect(res.statusCode).toBe(400);
    });

    test("user not found inside route → 404", async () => {
      pool.query
        // requireAuth passes first
        .mockResolvedValueOnce({
          rows: [{ user_id: 1, email: "a@mail.com" }],
        })
        // actual set-role route returns no user
        .mockResolvedValueOnce({
          rows: [],
        });

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({ role: "admin" });

      expect(res.statusCode).toBe(404);
    });
    // Add inside describe('POST /set-role', ...)

    test("staff role with qualifications + bio → 200", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      pool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 1, email: "a@mail.com" }] }) // requireAuth
        .mockResolvedValueOnce({ rows: [{ user_id: 1, role: null }] }); // set-role lookup
      pool.connect.mockResolvedValue(mockClient);

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({
          role: "staff",
          staffProfile: {
            clinic_id: 1,
            job_title: "General Practitioner",
            qualifications: "MBChB",
            specialties: ["General Practice", "Paediatrics"],
            bio: "Experienced GP",
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe("staff");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    test("staff role missing job_title → 500 (transaction rollback)", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      pool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 1, email: "a@mail.com" }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 1, role: null }] });
      pool.connect.mockResolvedValue(mockClient);

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({
          role: "staff",
          staffProfile: { clinic_id: 1, job_title: "" },
        });

      expect(res.statusCode).toBe(500);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    test("admin role with adminClinicId → 200", async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      pool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 1, email: "a@mail.com" }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 1, role: null }] });
      pool.connect.mockResolvedValue(mockClient);

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({ role: "admin", adminClinicId: 2 });

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe("admin");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    test("role already set → 200 with alreadySet: true", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ user_id: 1, email: "a@mail.com" }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 1, role: "staff" }] });

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({ role: "staff" });

      expect(res.statusCode).toBe(200);
      expect(res.body.alreadySet).toBe(true);
    });

    test("401 unauthorized when requireAuth cannot find user", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "missing@mail.com")
        .send({ role: "admin" });

      expect(res.statusCode).toBe(401);
    });

    test("DB failure → 500 branch", async () => {
      pool.query.mockRejectedValue(new Error("fail"));

      const res = await request(app)
        .post("/api/auth/set-role")
        .set("x-user-email", "a@mail.com")
        .send({ role: "admin" });

      expect(res.statusCode).toBe(500);
    });
  });

  // -----------------------------
  // /session
  // -----------------------------
  describe("POST /session", () => {
    test("missing idToken → 400", async () => {
      const res = await request(app).post("/api/auth/session").send({});

      expect(res.statusCode).toBe(400);
    });

    test("valid idToken → 200", async () => {
      const res = await request(app)
        .post("/api/auth/session")
        .send({ idToken: "test-token" });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

  // -----------------------------
  // /sync-password
  // -----------------------------
  describe("POST /sync-password", () => {
    test("missing fields → 400", async () => {
      const res = await request(app)
        .post("/api/auth/sync-password")
        .send({ email: "a@mail.com" });

      expect(res.statusCode).toBe(400);
    });

    test("password too short → 400", async () => {
      const res = await request(app).post("/api/auth/sync-password").send({
        email: "a@mail.com",
        newPassword: "123",
      });

      expect(res.statusCode).toBe(400);
    });

    test("user not found → 404", async () => {
      pool.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app).post("/api/auth/sync-password").send({
        email: "ghost@mail.com",
        newPassword: "12345678",
      });

      expect(res.statusCode).toBe(404);
    });

    test("DB crash → 500", async () => {
      pool.query.mockRejectedValue(new Error("fail"));

      const res = await request(app).post("/api/auth/sync-password").send({
        email: "a@mail.com",
        newPassword: "12345678",
      });

      expect(res.statusCode).toBe(500);
    });
  });

  // -----------------------------
  // /verify-admin-code
  // -----------------------------
  describe("POST /verify-admin-code", () => {
    test("missing code → 400", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ user_id: 1, email: "a@mail.com" }],
      });

      const res = await request(app)
        .post("/api/auth/verify-admin-code")
        .set("x-user-email", "a@mail.com")
        .send({});

      expect(res.statusCode).toBe(400);
    });

    test("401 unauthorized when missing x-user-email", async () => {
      const res = await request(app)
        .post("/api/auth/verify-admin-code")
        .send({ code: "123456" });

      expect(res.statusCode).toBe(401);
    });
  });
});
