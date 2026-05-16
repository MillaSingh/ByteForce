// appointments.test.js

jest.mock("../src/controllers/appointmentController", () => ({
  // GET /api/appointments/slots
  getSlots: jest.fn((req, res) =>
    res.status(200).json({
      slots: [
        {
          time: "10:00",
          available: true,
        },
      ],
    })
  ),

  // POST /api/appointments
  createBooking: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      appointment: {
        appointment_id: 1,
        clinic_id: req.body.clinic_id,
        patient_id: 1,
        appointment_date: req.body.appointment_date,
        appointment_time: req.body.appointment_time,
        reason_for_visit: req.body.reason_for_visit,
        phone_number: req.body.phone_number,
      },
    })
  ),

  // GET /api/appointments/my
  getMyAppointments: jest.fn((req, res) =>
    res.status(200).json([
      {
        appointment_id: 1,
        clinic_name: "Test Clinic",
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
        status: "booked",
      },
    ])
  ),

  // DELETE /api/appointments/:id
  cancelAppointment: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      message: "Appointment cancelled",
      appointment_id: Number(req.params.id),
    })
  ),

  // PUT /api/appointments/:id/reschedule
  rescheduleAppointment: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      appointment_id: Number(req.params.id),
      appointment_date: req.body.appointment_date,
      appointment_time: req.body.appointment_time,
    })
  ),
}));

jest.mock("../src/routes/authRoutes", () => ({
  requireAuth: (req, res, next) => {
    req.userEmail = "patient@test.com";
    req.user = {
      user_id: 1,
      email: "patient@test.com",
      role: "patient",
    };
    next();
  },
}));

const express = require("express");
const request = require("supertest");
const appointmentsRouter = require("../src/routes/appointments");

const {
  getSlots,
  createBooking,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} = require("../src/controllers/appointmentController");

const app = express();

app.use(express.json());
app.use("/api/appointments", appointmentsRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Appointments routes", () => {
  test("GET /api/appointments/slots returns available slots", async () => {
    const res = await request(app)
      .get("/api/appointments/slots")
      .query({
        clinicId: 1,
        date: "2026-05-01",
      });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots[0]).toHaveProperty("time");
    expect(getSlots).toHaveBeenCalledTimes(1);
  });

  test("POST /api/appointments creates a booking", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .send({
        user_email: "test@email.com",
        clinic_id: 1,
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
        reason_for_visit: "Checkup",
        phone_number: "0712345678",
        medical_aid: "None",
        additional_notes: "N/A",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("appointment");
    expect(res.body.appointment.clinic_id).toBe(1);
    expect(createBooking).toHaveBeenCalledTimes(1);
  });

  test("GET /api/appointments/my returns appointments", async () => {
    const res = await request(app)
      .get("/api/appointments/my")
      .query({
        patientId: 1,
      });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("clinic_name");
    expect(getMyAppointments).toHaveBeenCalledTimes(1);
  });

  test("DELETE /api/appointments/:id cancels an appointment", async () => {
    const res = await request(app)
      .delete("/api/appointments/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Appointment cancelled");
    expect(cancelAppointment).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/appointments/:id/reschedule reschedules appointment", async () => {
    const res = await request(app)
      .put("/api/appointments/1/reschedule")
      .send({
        appointment_date: "2026-05-02",
        appointment_time: "11:00",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.appointment_id).toBe(1);
    expect(res.body.appointment_date).toBe("2026-05-02");
    expect(rescheduleAppointment).toHaveBeenCalledTimes(1);
  });
});