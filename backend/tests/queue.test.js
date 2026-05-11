const queueController = require("../src/controllers/queueController");
const queueModel = require("../src/models/queueModel");

jest.mock("../src/models/queueModel");

describe("Queue Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return queue details with estimated wait time", async () => {
    req.body = {
      email: "testuser@email.com",
    };

    const mockQueueEntry = {
      queue_id: 1,
      clinic_id: 2,
      clinic_name: "Campus Health Clinic",
      patient_id: 10,
      appointment_id: 5,
      queue_position: 3,
      status: "waiting",
      check_in_time: "2026-05-11T08:00:00.000Z",
      called_time: null,
      people_waiting_at_clinic: 6,
    };

    queueModel.getMyQueueByUserId.mockResolvedValue(mockQueueEntry);

    await queueController.getMyQueueEntry(req, res);

    expect(queueModel.getMyQueueByUserId).toHaveBeenCalledWith("testuser@email.com");

    expect(res.json).toHaveBeenCalledWith({
      ...mockQueueEntry,
      estimated_wait_minutes: 20,
    });
  });

  test("should return null if patient is not in the queue", async () => {
    req.body = {
      email: "notinqueue@email.com",
    };

    queueModel.getMyQueueByUserId.mockResolvedValue(null);

    await queueController.getMyQueueEntry(req, res);

    expect(queueModel.getMyQueueByUserId).toHaveBeenCalledWith("notinqueue@email.com");
    expect(res.json).toHaveBeenCalledWith(null);
  });

  test("should return 400 if email is missing", async () => {
    req.body = {};

    await queueController.getMyQueueEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Email is required",
    });
  });

  test("should return 500 if there is a database error", async () => {
    req.body = {
      email: "testuser@email.com",
    };

    queueModel.getMyQueueByUserId.mockRejectedValue(new Error("Database error"));

    await queueController.getMyQueueEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch queue position",
    });
  });
});