jest.mock("../src/routes/authRoutes", () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      user_id: 1,
      email: "patient@test.com",
      role: "patient",
    };
    next();
  },
}));

jest.mock("../src/controllers/queueController", () => ({
  getMyQueueEntry: jest.fn((req, res) =>
    res.status(200).json({
      queue_id: 1,
      queue_position: 1,
      estimated_wait_minutes: 0,
    })
  ),

  checkIn: jest.fn((req, res) =>
    res.status(200).json({
      success: true,
      queue: {
        queue_id: 1,
        appointment_id: Number(req.params.appointment_id),
      },
    })
  ),
}));

const express = require("express");
const request = require("supertest");
const queueRoutes = require("../src/routes/queueRoutes");

const {
  getMyQueueEntry,
  checkIn,
} = require("../src/controllers/queueController");

const app = express();

app.use(express.json());
app.use("/api/queue", queueRoutes);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("queueRoutes", () => {
  test("POST /api/queue/my calls getMyQueueEntry", async () => {
    const res = await request(app)
      .post("/api/queue/my")
      .send({
        email: "patient@test.com",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("queue_id");
    expect(getMyQueueEntry).toHaveBeenCalledTimes(1);
  });

  test("POST /api/queue/checkin/:appointment_id calls checkIn", async () => {
    const res = await request(app)
      .post("/api/queue/checkin/5");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.queue.appointment_id).toBe(5);
    expect(checkIn).toHaveBeenCalledTimes(1);
  });
});