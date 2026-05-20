// dashboard.test.js

jest.mock("../src/controllers/dashboardController", () => ({
  getClinics: jest.fn((req, res) =>
    res.json([
      {
        clinic_id: 1,
        clinic_name: "Test Clinic",
      },
    ])
  ),

  getQueue: jest.fn((req, res) =>
    res.json([
      {
        queue_id: 1,
        queue_position: 1,
        clinic_id: Number(req.query.clinic_id) || 1,
        status: "waiting",
        first_name: "Test",
        last_name: "Patient",
        email: "test@mail.com",
        phone_number: "0712345678",
      },
    ])
  ),

  updateStatus: jest.fn((req, res) =>
    res.json({
      queue_id: Number(req.params.id),
      status: req.body.status,
    })
  ),

  deleteQueuePatient: jest.fn((req, res) =>
    res.json({
      message: "Patient removed from queue",
      deleted: {
        queue_id: Number(req.params.id),
      },
    })
  ),

  addWalkInPatient: jest.fn((req, res) =>
    res.json({
      queue_id: 1,
      queue_position: 1,
      clinic_id: req.body.clinic_id,
      status: "waiting",
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
    })
  ),

  rescheduleAppointment: jest.fn((req, res) =>
    res.json({
      appointment_id: Number(req.params.id),
      appointment_date: req.body.appointment_date,
      appointment_time: req.body.appointment_time,
    })
  ),
}));
jest.mock("../src/routes/authRoutes", () => ({
  requireAuth: (req, res, next) => {
    req.userEmail = "staff@test.com";
    req.user = {
      user_id: 206,
      email: "staff@test.com",
      role: "staff",
    };
    next();
  },
}));

const express = require("express");
const request = require("supertest");
const dashboardRoutes = require("../src/routes/dashboardRoutes");

const {
  getClinics,
  getQueue,
  updateStatus,
  deleteQueuePatient,
  addWalkInPatient,
  rescheduleAppointment,
} = require("../src/controllers/dashboardController");

const app = express();

app.use(express.json());
app.use("/api/queue", dashboardRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Dashboard routes", () => {
  test("GET /api/queue returns queue data for a clinic", async () => {
    const res = await request(app)
      .get("/api/queue")
      .set("x-user-email", "staff@test.com")
      .query({ clinic_id: 1 });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("queue_id");
    expect(res.body[0].clinic_id).toBe(1);
    expect(getQueue).toHaveBeenCalledTimes(1);
  });

  test("GET /api/queue/clinics returns the linked clinic", async () => {
    const res = await request(app)
      .get("/api/queue/clinics")
      .query({ clinic_id: 1 });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("clinic_name");
    expect(getClinics).toHaveBeenCalledTimes(1);
  });

  test("POST /api/queue/add-walkin adds a walk-in patient", async () => {
    const res = await request(app)
      .post("/api/queue/add-walkin")
      .send({
        first_name: "Test",
        last_name: "User",
        email: "test@mail.com",
        phone_number: "0712345678",
        clinic_id: 1,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("queue_id");
    expect(res.body.status).toBe("waiting");
    expect(addWalkInPatient).toHaveBeenCalledTimes(1);
  });

  test("PATCH /api/queue/:id updates patient status", async () => {
    const res = await request(app)
      .patch("/api/queue/1")
      .send({
        status: "in_consultation",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("in_consultation");
    expect(updateStatus).toHaveBeenCalledTimes(1);
  });

  test("DELETE /api/queue/:id removes patient from queue", async () => {
    const res = await request(app)
      .delete("/api/queue/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Patient removed from queue");
    expect(deleteQueuePatient).toHaveBeenCalledTimes(1);
  });

  test("PATCH /api/queue/reschedule/:id reschedules appointment", async () => {
    const res = await request(app)
      .patch("/api/queue/appointments/5")
      .send({
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.appointment_id).toBe(5);
    expect(res.body.appointment_date).toBe("2026-05-01");
    expect(rescheduleAppointment).toHaveBeenCalledTimes(1);
  });
});