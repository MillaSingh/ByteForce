jest.mock("../src/models/queueModel", () => ({
  getMyQueueByUserId: jest.fn(),
  getQueueEntryByAppointment: jest.fn(),
  createQueueEntry: jest.fn(),
  checkInQueueEntry: jest.fn(),
}));

const queueModel = require("../src/models/queueModel");

const {
  getMyQueueEntry,
  checkIn,
} = require("../src/controllers/queueController");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("queueController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyQueueEntry", () => {
    test("returns 400 when email is missing", async () => {
      const req = {
        body: {},
      };

      const res = mockResponse();

      await getMyQueueEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email is required",
      });
    });

    test("returns null when queue entry does not exist", async () => {
      const req = {
        body: {
          email: "patient@test.com",
        },
      };

      const res = mockResponse();

      queueModel.getMyQueueByUserId.mockResolvedValue(null);

      await getMyQueueEntry(req, res);

      expect(queueModel.getMyQueueByUserId).toHaveBeenCalledWith("patient@test.com");
      expect(res.json).toHaveBeenCalledWith(null);
    });

    test("returns queue entry with estimated wait time", async () => {
      const req = {
        body: {
          email: "patient@test.com",
        },
      };

      const res = mockResponse();

      queueModel.getMyQueueByUserId.mockResolvedValue({
        queue_id: 1,
        queue_position: 4,
        status: "waiting",
      });

      await getMyQueueEntry(req, res);

      expect(res.json).toHaveBeenCalledWith({
        queue_id: 1,
        queue_position: 4,
        status: "waiting",
        estimated_wait_minutes: 30,
      });
    });

    test("returns 500 when model fails", async () => {
      const req = {
        body: {
          email: "patient@test.com",
        },
      };

      const res = mockResponse();

      queueModel.getMyQueueByUserId.mockRejectedValue(new Error("Database error"));

      await getMyQueueEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to fetch queue position",
      });
    });
  });

  describe("checkIn", () => {
    test("returns 400 when appointment_id is invalid", async () => {
      const req = {
        params: {
          appointment_id: "abc",
        },
      };

      const res = mockResponse();

      await checkIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid appointment_id",
      });
    });

    test("creates queue entry if it does not exist", async () => {
      const req = {
        params: {
          appointment_id: "5",
        },
      };

      const res = mockResponse();

      queueModel.getQueueEntryByAppointment.mockResolvedValue(null);
      queueModel.createQueueEntry.mockResolvedValue({
        queue_id: 1,
        appointment_id: 5,
      });

      await checkIn(req, res);

      expect(queueModel.getQueueEntryByAppointment).toHaveBeenCalledWith(5);
      expect(queueModel.createQueueEntry).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        queue: {
          queue_id: 1,
          appointment_id: 5,
        },
      });
    });

    test("returns 400 when patient is already checked in", async () => {
      const req = {
        params: {
          appointment_id: "5",
        },
      };

      const res = mockResponse();

      queueModel.getQueueEntryByAppointment.mockResolvedValue({
        queue_id: 1,
        appointment_id: 5,
        check_in_time: "2026-05-01T10:00:00",
      });

      await checkIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Already checked in",
      });
    });

    test("checks in existing queue entry", async () => {
      const req = {
        params: {
          appointment_id: "5",
        },
      };

      const res = mockResponse();

      queueModel.getQueueEntryByAppointment.mockResolvedValue({
        queue_id: 1,
        appointment_id: 5,
        check_in_time: null,
      });

      queueModel.checkInQueueEntry.mockResolvedValue({
        queue_id: 1,
        appointment_id: 5,
        check_in_time: "2026-05-01T10:00:00",
      });

      await checkIn(req, res);

      expect(queueModel.checkInQueueEntry).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        queue: {
          queue_id: 1,
          appointment_id: 5,
          check_in_time: "2026-05-01T10:00:00",
        },
      });
    });

    test("returns 500 when check-in fails", async () => {
      const req = {
        params: {
          appointment_id: "5",
        },
      };

      const res = mockResponse();

      queueModel.getQueueEntryByAppointment.mockRejectedValue(
        new Error("Database error")
      );

      await checkIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Server error",
      });
    });
  });
});