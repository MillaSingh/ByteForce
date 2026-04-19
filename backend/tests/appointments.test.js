const request = require('supertest');
const app = require('../server');
const appointmentModel = require('../src/models/appointmentModel');

jest.mock('../src/models/appointmentModel');

describe('Appointments API', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Successful booking
  test('should create a booking successfully', async () => {

    appointmentModel.checkSlot.mockResolvedValue([]);

    appointmentModel.createAppointment.mockResolvedValue({
      appointment_id: 1,
      clinic_id: 1
    });

    const response = await request(app)
      .post('/api/appointments')
      .send({
        clinic_id: 1,
        appointment_date: '2026-05-01',
        appointment_time: '10:00',
        reason_for_visit: 'Checkup',
        phone_number: '1234567890',
        medical_aid: 'None',
        additional_notes: 'N/A'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('appointment');
    expect(response.body).toHaveProperty('ref');

    expect(response.body.ref).toBeDefined();
    expect(appointmentModel.checkSlot).toHaveBeenCalled();
    expect(appointmentModel.createAppointment).toHaveBeenCalled();
  });

  // Slot already taken
  test('should fail if slot is already booked', async () => {

    appointmentModel.checkSlot.mockResolvedValue([{}]);

    const response = await request(app)
      .post('/api/appointments')
      .send({
        clinic_id: 1,
        appointment_date: '2026-05-01',
        appointment_time: '11:00'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Time slot already booked");
  });

  // Get appointments
  test('should return list of appointments', async () => {

    appointmentModel.getAppointmentsByUser.mockResolvedValue([
      {
        appointment_id: 1,
        clinic_name: "Test Clinic",
        appointment_date: "2026-05-01",
        appointment_time: "10:00"
      }
    ]);

    const response = await request(app)
      .get('/api/appointments/my');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty('clinic_name');
  });

  // Server error handling
  test('should handle server error gracefully', async () => {

    appointmentModel.checkSlot.mockRejectedValue(new Error("DB error"));

    const response = await request(app)
      .post('/api/appointments')
      .send({
        clinic_id: 1,
        appointment_date: '2026-05-01',
        appointment_time: '12:00'
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe("Server error");
  });

});
