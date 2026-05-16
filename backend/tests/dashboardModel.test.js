const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock("../src/db", () => ({
  query: jest.fn(),
  connect: jest.fn(() => mockClient),
}));

const pool = require("../src/db");
const dashboardModel = require("../src/models/dashboardModel");

describe("dashboardModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getQueuePatients returns queue rows for clinic", async () => {
    pool.query.mockResolvedValue({
      rows: [{ queue_id: 1, clinic_id: 1 }],
    });

    const result = await dashboardModel.getQueuePatients(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE q.clinic_id = $1"),
      [1]
    );

    expect(result).toEqual([{ queue_id: 1, clinic_id: 1 }]);
  });

  test("updateQueueStatus updates status", async () => {
    pool.query.mockResolvedValue({
      rows: [{ queue_id: 1, status: "waiting" }],
    });

    const result = await dashboardModel.updateQueueStatus(1, "waiting");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE queue_entry"),
      ["waiting", 1]
    );

    expect(result).toEqual({ queue_id: 1, status: "waiting" });
  });

  test("updateQueueStatus adds called_time for in_consultation", async () => {
    pool.query.mockResolvedValue({
      rows: [{ queue_id: 1, status: "in_consultation" }],
    });

    await dashboardModel.updateQueueStatus(1, "in_consultation");

    expect(pool.query.mock.calls[0][0]).toContain("called_time = CURRENT_TIMESTAMP");
  });

  test("updateQueueStatus adds complete_time for complete", async () => {
    pool.query.mockResolvedValue({
      rows: [{ queue_id: 1, status: "complete" }],
    });

    await dashboardModel.updateQueueStatus(1, "complete");

    expect(pool.query.mock.calls[0][0]).toContain("complete_time = CURRENT_TIMESTAMP");
  });

  test("addWalkInPatient creates new user and queue entry", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ user_id: 10 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ next_position: 1 }] })
      .mockResolvedValueOnce({ rows: [{ queue_id: 1 }] })
      .mockResolvedValueOnce(undefined);

    const result = await dashboardModel.addWalkInPatient(
      "Test",
      "User",
      "test@email.com",
      1,
      "0712345678"
    );

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
    expect(result).toEqual({ queue_id: 1 });
  });

  test("addWalkInPatient reuses existing user", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ user_id: 10 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ next_position: 2 }] })
      .mockResolvedValueOnce({ rows: [{ queue_id: 2 }] })
      .mockResolvedValueOnce(undefined);

    const result = await dashboardModel.addWalkInPatient(
      "Existing",
      "User",
      "existing@email.com",
      1,
      "0712345678"
    );

    expect(result).toEqual({ queue_id: 2 });
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
  });

  test("addWalkInPatient rolls back when patient already in queue", async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ user_id: 10 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ queue_id: 99 }] })
      .mockResolvedValueOnce(undefined);

    await expect(
      dashboardModel.addWalkInPatient(
        "Test",
        "User",
        "test@email.com",
        1,
        "0712345678"
      )
    ).rejects.toThrow("Patient is already in this clinic queue");

    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });

  test("rescheduleAppointment updates appointment", async () => {
    pool.query.mockResolvedValue({
      rows: [{ appointment_id: 1 }],
    });

    const result = await dashboardModel.rescheduleAppointment(
      1,
      "2026-05-01",
      "10:00"
    );

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE appointment"),
      ["2026-05-01", "10:00", 1]
    );

    expect(result).toEqual({ appointment_id: 1 });
  });

  test("deleteQueuePatient deletes queue row", async () => {
    pool.query.mockResolvedValue({
      rows: [{ queue_id: 1 }],
    });

    const result = await dashboardModel.deleteQueuePatient(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM queue_entry"),
      [1]
    );

    expect(result).toEqual({ queue_id: 1 });
  });

  test("getClinics returns clinic rows", async () => {
    pool.query.mockResolvedValue({
      rows: [{ clinic_id: 1, clinic_name: "Test Clinic" }],
    });

    const result = await dashboardModel.getClinics(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE clinic_id = $1"),
      [1]
    );

    expect(result).toEqual([{ clinic_id: 1, clinic_name: "Test Clinic" }]);
  });
});