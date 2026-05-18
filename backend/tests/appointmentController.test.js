const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock("../src/models/appointmentModel", () => ({
  getUserByEmail: jest.fn(),
  checkSlot: jest.fn(),
  createAppointment: jest.fn(),
  getUserByFirebaseUID: jest.fn(),
  getAppointmentsByUser: jest.fn(),
  getAvailableSlots: jest.fn(),
  cancelAppointment: jest.fn(),
  checkSlotExcludingCurrent: jest.fn(),
  updateAppointmentSlot: jest.fn(),
}));

const appointmentModel = require("../src/models/appointmentModel");

const {
  createBooking,
  getMyAppointments,
  getSlots,
  cancelAppointment,
  rescheduleAppointment,
} = require("../src/controllers/appointmentController");

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("appointmentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── createBooking ──────────────────────────────────────────────────────────

  test("createBooking creates a booking successfully", async () => {
    const req = {
      body: {
        user_email: "test@email.com",
        clinic_id: 1,
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    appointmentModel.getUserByEmail.mockResolvedValue({ user_id: 5 });
    appointmentModel.checkSlot.mockResolvedValue([]);
    appointmentModel.createAppointment.mockResolvedValue({ appointment_id: 1 });

    await createBooking(req, res);

    expect(appointmentModel.getUserByEmail).toHaveBeenCalledWith("test@email.com");
    expect(appointmentModel.checkSlot).toHaveBeenCalledWith(1, "2026-05-01", "10:00");
    expect(appointmentModel.createAppointment).toHaveBeenCalledWith({
      ...req.body,
      patient_id: 5,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test("createBooking returns 404 when user is not found", async () => {
    const req = {
      body: { user_email: "missing@email.com" },
    };
    const res = mockResponse();

    appointmentModel.getUserByEmail.mockResolvedValue(null);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "User not found. Please log in.",
    });
  });

  test("createBooking returns 400 when slot is already booked", async () => {
    const req = {
      body: {
        user_email: "test@email.com",
        clinic_id: 1,
        appointment_date: "2026-05-01",
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    appointmentModel.getUserByEmail.mockResolvedValue({ user_id: 5 });
    appointmentModel.checkSlot.mockResolvedValue([{ appointment_id: 1 }]);

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Time slot already booked" });
  });

  test("createBooking returns 500 when booking fails", async () => {
    const req = {
      body: { user_email: "test@email.com" },
    };
    const res = mockResponse();

    appointmentModel.getUserByEmail.mockRejectedValue(new Error("DB error"));

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
  });

  // ── getMyAppointments ──────────────────────────────────────────────────────
  // ── getMyAppointments ──────────────────────────────────────────────────────

test("getMyAppointments returns appointments via firebase token", async () => {
  const req = {
    cookies: { firebaseToken: "fake-token" },
    headers: {}
  };
  const res = mockResponse();

  mockVerifyIdToken.mockResolvedValueOnce({ uid: "firebase-uid" });
  appointmentModel.getUserByFirebaseUID.mockResolvedValueOnce({ user_id: 7 });
  appointmentModel.getAppointmentsByUser.mockResolvedValueOnce([
    { appointment_id: 1 }
  ]);

  await getMyAppointments(req, res);

  expect(mockVerifyIdToken).toHaveBeenCalledWith("fake-token");
  expect(appointmentModel.getUserByFirebaseUID).toHaveBeenCalledWith("firebase-uid");
  expect(appointmentModel.getAppointmentsByUser).toHaveBeenCalledWith(7);
  expect(res.json).toHaveBeenCalledWith([{ appointment_id: 1 }]);
});

test("getMyAppointments returns 401 when no token", async () => {
  const req = {
    cookies: {},
    headers: {}
  };
  const res = mockResponse();

  await getMyAppointments(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
});

test("getMyAppointments returns 404 when user not found in database", async () => {
  const req = {
    cookies: { firebaseToken: "fake-token" },
    headers: {}
  };
  const res = mockResponse();

  mockVerifyIdToken.mockResolvedValueOnce({ uid: "firebase-uid" });
  appointmentModel.getUserByFirebaseUID.mockResolvedValueOnce(null);

  await getMyAppointments(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
});

test("getMyAppointments returns 500 when Firebase verification fails", async () => {
  const req = {
    cookies: { firebaseToken: "bad-token" },
    headers: {}
  };
  const res = mockResponse();

  mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid token"));

  await getMyAppointments(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
});

  // ── getSlots ───────────────────────────────────────────────────────────────

  test("getSlots returns 400 when clinicId or date is missing", async () => {
    const req = { query: {} };
    const res = mockResponse();

    await getSlots(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "clinicId and date are required",
    });
  });

  test("getSlots returns slots for valid date", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const req = {
      query: { clinicId: "1", date: `${futureYear}-05-01` },
    };
    const res = mockResponse();

    appointmentModel.getAvailableSlots.mockResolvedValue({
      slots: [{ time: "10:00", available: true }],
    });

    await getSlots(req, res);

    expect(res.json).toHaveBeenCalledWith({
      slots: [{ time: "10:00", available: true }],
    });
  });

  test("getSlots returns 500 when getAvailableSlots fails", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const req = {
      query: { clinicId: "1", date: `${futureYear}-05-01` },
    };
    const res = mockResponse();

    appointmentModel.getAvailableSlots.mockRejectedValue(new Error("DB error"));

    await getSlots(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch available slots",
    });
  });

  // ── cancelAppointment ──────────────────────────────────────────────────────

  test("cancelAppointment cancels an appointment successfully", async () => {
    const req = { params: { id: "10" } };
    const res = mockResponse();

    appointmentModel.cancelAppointment.mockResolvedValue();

    await cancelAppointment(req, res);

    expect(appointmentModel.cancelAppointment).toHaveBeenCalledWith("10");
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test("cancelAppointment returns 500 when cancellation fails", async () => {
    const req = { params: { id: "10" } };
    const res = mockResponse();

    appointmentModel.cancelAppointment.mockRejectedValue(new Error("DB error"));

    await cancelAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server error" });
  });

  // ── rescheduleAppointment ──────────────────────────────────────────────────

  test("rescheduleAppointment returns 400 when selected time is in the past", async () => {
    const req = {
      params: { id: "1" },
      body: {
        clinic_id: 1,
        appointment_date: "2000-01-01",
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    await rescheduleAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Cannot book a past time slot",
    });
  });

  test("rescheduleAppointment returns 400 when new slot is already booked", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const req = {
      params: { id: "1" },
      body: {
        clinic_id: 1,
        appointment_date: `${futureYear}-05-01`,
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    appointmentModel.checkSlotExcludingCurrent.mockResolvedValue([
      { appointment_id: 2 },
    ]);

    await rescheduleAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Time slot already booked" });
  });

  test("rescheduleAppointment reschedules successfully", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const req = {
      params: { id: "1" },
      body: {
        clinic_id: 1,
        appointment_date: `${futureYear}-05-01`,
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    appointmentModel.checkSlotExcludingCurrent.mockResolvedValue([]);
    appointmentModel.updateAppointmentSlot.mockResolvedValue({ appointment_id: 1 });

    await rescheduleAppointment(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      appointment: { appointment_id: 1 },
    });
  });

  test("rescheduleAppointment returns 500 when rescheduling fails", async () => {
    const futureYear = new Date().getFullYear() + 1;
    const req = {
      params: { id: "1" },
      body: {
        clinic_id: 1,
        appointment_date: `${futureYear}-05-01`,
        appointment_time: "10:00",
      },
    };
    const res = mockResponse();

    appointmentModel.checkSlotExcludingCurrent.mockRejectedValue(new Error("DB error"));

    await rescheduleAppointment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});