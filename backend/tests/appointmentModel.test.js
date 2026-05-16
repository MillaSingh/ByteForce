jest.mock("../src/db", () => ({
  query: jest.fn(),
}));

const db = require("../src/db");

const appointmentModel = require("../src/models/appointmentModel");

describe("appointmentModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("checkSlot returns matching appointments", async () => {
    db.query.mockResolvedValue({
      rows: [{ appointment_id: 1 }],
    });

    const result = await appointmentModel.checkSlot(1, "2026-05-01", "10:00");

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM appointment"),
      [1, "2026-05-01", "10:00"]
    );

    expect(result).toEqual([{ appointment_id: 1 }]);
  });

  test("createAppointment inserts appointment and returns row", async () => {
    const data = {
      patient_id: 1,
      clinic_id: 2,
      appointment_date: "2026-05-01",
      appointment_time: "10:00",
      reason_for_visit: "Checkup",
      phone_number: "0712345678",
      medical_aid: "None",
      additional_notes: "N/A",
    };

    db.query.mockResolvedValue({
      rows: [{ appointment_id: 1 }],
    });

    const result = await appointmentModel.createAppointment(data);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO appointment"),
      [
        1,
        2,
        "2026-05-01",
        "10:00",
        "Checkup",
        "0712345678",
        "None",
        "N/A",
      ]
    );

    expect(result).toEqual({ appointment_id: 1 });
  });

  test("getAppointmentsByUser returns appointments", async () => {
    db.query.mockResolvedValue({
      rows: [{ appointment_id: 1, clinic_name: "Test Clinic" }],
    });

    const result = await appointmentModel.getAppointmentsByUser(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE a.patient_id = $1"),
      [1]
    );

    expect(result).toEqual([{ appointment_id: 1, clinic_name: "Test Clinic" }]);
  });

  test("getAvailableSlots returns empty slots when clinic is closed", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ is_closed: true }],
    });

    const result = await appointmentModel.getAvailableSlots(1, "2026-05-04");

    expect(result.slots).toEqual([]);
    expect(result).toHaveProperty("dayOfWeek");
  });

  test("getAvailableSlots returns generated slots with availability", async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          {
            open_time: "08:00:00",
            close_time: "09:00:00",
            is_closed: false,
            slot_capacity: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            appointment_time: "08:00:00",
            booking_count: "1",
          },
        ],
      });

    const result = await appointmentModel.getAvailableSlots(1, "2026-05-04");

    expect(result.slots).toEqual([
      { time: "08:00", available: true },
      { time: "08:30", available: true },
    ]);

    expect(result).toHaveProperty("dayOfWeek");
  });

  test("getAvailableSlots marks slot unavailable when capacity is full", async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          {
            open_time: "08:00:00",
            close_time: "08:30:00",
            is_closed: false,
            slot_capacity: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            appointment_time: "08:00:00",
            booking_count: "1",
          },
        ],
      });

    const result = await appointmentModel.getAvailableSlots(1, "2026-05-04");

    expect(result.slots).toEqual([
      { time: "08:00", available: false },
    ]);
  });

  test("cancelAppointment updates appointment status", async () => {
    db.query.mockResolvedValue({ rows: [] });

    await appointmentModel.cancelAppointment(5);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'cancelled'"),
      [5]
    );
  });

  test("checkSlotExcludingCurrent returns rows", async () => {
    db.query.mockResolvedValue({
      rows: [{ appointment_id: 2 }],
    });

    const result = await appointmentModel.checkSlotExcludingCurrent(
      1,
      "2026-05-01",
      "10:00",
      5
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("appointment_id != $4"),
      [1, "2026-05-01", "10:00", 5]
    );

    expect(result).toEqual([{ appointment_id: 2 }]);
  });

  test("updateAppointmentSlot updates and returns appointment", async () => {
    db.query.mockResolvedValue({
      rows: [{ appointment_id: 1 }],
    });

    const result = await appointmentModel.updateAppointmentSlot(
      1,
      "2026-05-01",
      "10:00"
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE appointment"),
      ["2026-05-01", "10:00", 1]
    );

    expect(result).toEqual({ appointment_id: 1 });
  });

  test("getUserByEmail returns user row", async () => {
    db.query.mockResolvedValue({
      rows: [{ user_id: 1 }],
    });

    const result = await appointmentModel.getUserByEmail("test@email.com");

    expect(db.query).toHaveBeenCalledWith(
      'SELECT user_id FROM "user" WHERE email = $1',
      ["test@email.com"]
    );

    expect(result).toEqual({ user_id: 1 });
  });

  test("getUserByFirebaseUID returns user row", async () => {
    db.query.mockResolvedValue({
      rows: [{ user_id: 1 }],
    });

    const result = await appointmentModel.getUserByFirebaseUID("firebase-uid");

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE external_auth_id = $1"),
      ["firebase-uid"]
    );

    expect(result).toEqual({ user_id: 1 });
  });
});