// dashboardRoutes.test.js

const express = require("express");
const request = require("supertest");

/* MOCK AUTH MIDDLEWARE */

jest.mock("../src/routes/authRoutes", () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      user_id: 1,
      email: "staff@test.com",
      role: "staff",
    };

    next();
  },
}));

/* MOCK CONTROLLER */

jest.mock("../src/controllers/dashboardController", () => ({
  getQueue: jest.fn((req, res) => {
    res.status(200).json([
      {
        queue_id: 1,
        first_name: "John",
        status: "waiting",
      },
    ]);
  }),

  getClinics: jest.fn((req, res) => {
    res.status(200).json([
      {
        clinic_id: 1,
        clinic_name: "Test Clinic",
      },
    ]);
  }),

  updateStatus: jest.fn((req, res) => {
    res.status(200).json({
      queue_id: req.params.id,
      status: req.body.status,
    });
  }),

  addWalkInPatient: jest.fn((req, res) => {
    res.status(200).json({
      queue_id: 1,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    });
  }),

  deleteQueuePatient: jest.fn((req, res) => {
    res.status(200).json({
      message: "Patient removed from queue",
    });
  }),

  rescheduleAppointment: jest.fn((req, res) => {
    res.status(200).json({
      appointment_id: req.params.id,
      appointment_date: req.body.appointment_date,
      appointment_time: req.body.appointment_time,
    });
  }),
}));

/* IMPORT ROUTES*/

const dashboardRoutes = require("../src/routes/dashboardRoutes");

const dashboardController = require(
  "../src/controllers/dashboardController"
);

/* EXPRESS APP */

const app = express();

app.use(express.json());

app.use("/api/queue", dashboardRoutes);

/* 
   TESTS*/

describe("dashboardRoutes", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/queue calls getQueue", async () => {

    const res = await request(app)
      .get("/api/queue?clinic_id=1");

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.getQueue
    ).toHaveBeenCalledTimes(1);

    expect(res.body[0]).toHaveProperty(
      "queue_id"
    );
  });

  test("GET /api/queue/clinics calls getClinics", async () => {

    const res = await request(app)
      .get("/api/queue/clinics?clinic_id=1");

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.getClinics
    ).toHaveBeenCalledTimes(1);

    expect(res.body[0]).toHaveProperty(
      "clinic_name"
    );
  });

  test("POST /api/queue/add-walkin calls addWalkInPatient", async () => {

    const res = await request(app)
      .post("/api/queue/add-walkin")
      .send({
        first_name: "John",
        last_name: "Doe",
        email: "john@test.com",
        clinic_id: 1,
        phone_number: "0712345678",
      });

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.addWalkInPatient
    ).toHaveBeenCalledTimes(1);

    expect(res.body.first_name).toBe("John");
  });

  test("PATCH /api/queue/:id calls updateStatus", async () => {

    const res = await request(app)
      .patch("/api/queue/1")
      .send({
        status: "complete",
      });

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.updateStatus
    ).toHaveBeenCalledTimes(1);

    expect(res.body.status).toBe("complete");
  });

  test("DELETE /api/queue/:id calls deleteQueuePatient", async () => {

    const res = await request(app)
      .delete("/api/queue/1");

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.deleteQueuePatient
    ).toHaveBeenCalledTimes(1);

    expect(res.body.message).toBe(
      "Patient removed from queue"
    );
  });

  test("PATCH /api/queue/appointments/:id calls rescheduleAppointment", async () => {

    const res = await request(app)
      .patch("/api/queue/appointments/5")
      .send({
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
      });

    expect(res.statusCode).toBe(200);

    expect(
      dashboardController.rescheduleAppointment
    ).toHaveBeenCalledTimes(1);

    expect(res.body.appointment_id).toBe("5");
  });

});