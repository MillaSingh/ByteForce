jest.mock("../src/models/dashboardModel", () => ({
  getQueuePatients: jest.fn(),
  getClinics: jest.fn(),
  updateQueueStatus: jest.fn(),
  addWalkInPatient: jest.fn(),
  deleteQueuePatient: jest.fn(),
  rescheduleAppointment: jest.fn(),
}));

const dashboardModel = require("../src/models/dashboardModel");

const {
  getQueue,
  getClinics,
  updateStatus,
  addWalkInPatient,
  deleteQueuePatient,
  rescheduleAppointment,
} = require("../src/controllers/dashboardController");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("dashboardController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getQueue returns 400 when clinic_id is missing", async () => {
    const req = { query: {} };
    const res = mockResponse();

    await getQueue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "clinic_id is required",
    });
  });

  test("getQueue returns queue data", async () => {
    const req = { query: { clinic_id: "1" } };
    const res = mockResponse();

    dashboardModel.getQueuePatients.mockResolvedValue([
      { queue_id: 1 },
    ]);

    await getQueue(req, res);

    expect(dashboardModel.getQueuePatients).toHaveBeenCalledWith("1");
    expect(res.json).toHaveBeenCalledWith([{ queue_id: 1 }]);
  });

  test("getQueue returns 500 on error", async () => {
    const req = { query: { clinic_id: "1" } };
    const res = mockResponse();

    dashboardModel.getQueuePatients.mockRejectedValue(new Error("DB error"));

    await getQueue(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server error",
    });
  });

  test("getClinics returns 400 when clinic_id missing", async () => {
    const req = { query: {} };
    const res = mockResponse();

    await getClinics(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "clinic_id is required",
    });
  });

  test("getClinics returns clinics", async () => {
    const req = { query: { clinic_id: "1" } };
    const res = mockResponse();

    dashboardModel.getClinics.mockResolvedValue([
      { clinic_id: 1, clinic_name: "Test Clinic" },
    ]);

    await getClinics(req, res);

    expect(dashboardModel.getClinics).toHaveBeenCalledWith("1");
    expect(res.json).toHaveBeenCalledWith([
      { clinic_id: 1, clinic_name: "Test Clinic" },
    ]);
  });

  test("updateStatus updates queue status", async () => {
    const req = {
      params: { id: "1" },
      body: { status: "complete" },
    };

    const res = mockResponse();

    dashboardModel.updateQueueStatus.mockResolvedValue({
      queue_id: 1,
      status: "complete",
    });

    await updateStatus(req, res);

    expect(dashboardModel.updateQueueStatus).toHaveBeenCalledWith("1", "complete");
    expect(res.json).toHaveBeenCalledWith({
      queue_id: 1,
      status: "complete",
    });
  });

  test("addWalkInPatient adds patient", async () => {
    const req = {
      body: {
        first_name: "Test",
        last_name: "User",
        email: "test@email.com",
        clinic_id: 1,
        phone_number: "0712345678",
      },
    };

    const res = mockResponse();

    dashboardModel.addWalkInPatient.mockResolvedValue({
      queue_id: 1,
    });

    await addWalkInPatient(req, res);

    expect(dashboardModel.addWalkInPatient).toHaveBeenCalledWith(
      "Test",
      "User",
      "test@email.com",
      1,
      "0712345678"
    );

    expect(res.json).toHaveBeenCalledWith({
      queue_id: 1,
    });
  });

  test("deleteQueuePatient returns 404 when not found", async () => {
    const req = { params: { id: "1" } };
    const res = mockResponse();

    dashboardModel.deleteQueuePatient.mockResolvedValue(null);

    await deleteQueuePatient(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Queue patient not found",
    });
  });

  test("deleteQueuePatient deletes patient", async () => {
    const req = { params: { id: "1" } };
    const res = mockResponse();

    dashboardModel.deleteQueuePatient.mockResolvedValue({
      queue_id: 1,
    });

    await deleteQueuePatient(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Patient removed from queue",
      deleted: {
        queue_id: 1,
      },
    });
  });

  test("rescheduleAppointment reschedules appointment", async () => {
    const req = {
      params: { id: "5" },
      body: {
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
      },
    };

    const res = mockResponse();

    dashboardModel.rescheduleAppointment.mockResolvedValue({
      appointment_id: 5,
    });

    await rescheduleAppointment(req, res);

    expect(dashboardModel.rescheduleAppointment).toHaveBeenCalledWith(
      "5",
      "2026-05-01",
      "10:00"
    );

    expect(res.json).toHaveBeenCalledWith({
      appointment_id: 5,
    });
  });
});