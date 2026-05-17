jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const pool = require("../src/db");
const queueModel = require("../src/models/queueModel");

describe("queueModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getMyQueueByUserId returns the current queue entry for a user email", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          queue_id: 1,
          clinic_id: 1,
          clinic_name: "Test Clinic",
          patient_id: 10,
          queue_position: 2,
          status: "waiting",
          people_waiting_at_clinic: "3",
        },
      ],
    });

    const result = await queueModel.getMyQueueByUserId("patient@test.com");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE u.email = $1"),
      ["patient@test.com"]
    );

    expect(result).toEqual({
      queue_id: 1,
      clinic_id: 1,
      clinic_name: "Test Clinic",
      patient_id: 10,
      queue_position: 2,
      status: "waiting",
      people_waiting_at_clinic: "3",
    });
  });

  test("getQueueEntryByAppointment returns queue entry for appointment", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          queue_id: 1,
          appointment_id: 5,
          status: "waiting",
        },
      ],
    });

    const result = await queueModel.getQueueEntryByAppointment(5);

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM queue_entry WHERE appointment_id = $1",
      [5]
    );

    expect(result).toEqual({
      queue_id: 1,
      appointment_id: 5,
      status: "waiting",
    });
  });

  test("checkInQueueEntry updates check-in time and status", async () => {
    pool.query.mockResolvedValue({
      rows: [
        {
          queue_id: 1,
          appointment_id: 5,
          status: "waiting",
          check_in_time: "2026-05-01T10:00:00",
        },
      ],
    });

    const result = await queueModel.checkInQueueEntry(5);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE queue_entry"),
      [5]
    );

    expect(result).toEqual({
      queue_id: 1,
      appointment_id: 5,
      status: "waiting",
      check_in_time: "2026-05-01T10:00:00",
    });
  });

  test("createQueueEntry creates a queue entry for an appointment", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            appointment_id: 5,
            clinic_id: 1,
            patient_id: 10,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            total: "2",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            queue_id: 1,
            appointment_id: 5,
            clinic_id: 1,
            patient_id: 10,
            queue_position: 3,
            status: "waiting",
          },
        ],
      });

    const result = await queueModel.createQueueEntry(5);

    expect(pool.query).toHaveBeenCalledTimes(3);

    expect(pool.query.mock.calls[0][0]).toContain("FROM appointment");
    expect(pool.query.mock.calls[0][1]).toEqual([5]);

    expect(pool.query.mock.calls[1][0]).toContain("SELECT COUNT(*) AS total");
    expect(pool.query.mock.calls[1][1]).toEqual([1]);

    expect(pool.query.mock.calls[2][0]).toContain("INSERT INTO queue_entry");
    expect(pool.query.mock.calls[2][1]).toEqual([1, 10, 5, 3]);

    expect(result).toEqual({
      queue_id: 1,
      appointment_id: 5,
      clinic_id: 1,
      patient_id: 10,
      queue_position: 3,
      status: "waiting",
    });
  });

  test("createQueueEntry throws error when appointment is not found", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [],
    });

    await expect(queueModel.createQueueEntry(999)).rejects.toThrow(
      "Appointment not found"
    );

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toContain("FROM appointment");
    expect(pool.query.mock.calls[0][1]).toEqual([999]);
  });
});