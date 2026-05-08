const db = require('../db');

// CHECK SLOT
const checkSlot = async (
  clinic_id,
  appointment_date,
  appointment_time
) => {

  const result = await db.query(
    `SELECT * FROM appointment
     WHERE clinic_id = $1
     AND appointment_date = $2
     AND appointment_time = $3
     AND status IN ('pending', 'confirmed')`,
    [clinic_id, appointment_date, appointment_time]
  );

  return result.rows;
};

// CREATE APPOINTMENT
const createAppointment = async (data) => {
  const {
    patient_id,
    clinic_id,
    appointment_date,
    appointment_time,
    reason_for_visit,
    phone_number,
    medical_aid,
    additional_notes
  } = data;

  const result = await db.query(
    `INSERT INTO appointment
    (patient_id, clinic_id, appointment_date, appointment_time,
     reason_for_visit, phone_number, medical_aid, additional_notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      patient_id,
      clinic_id,
      appointment_date,
      appointment_time,
      reason_for_visit,
      phone_number,
      medical_aid,
      additional_notes
    ]
  );

  return result.rows[0];
};

// GET APPOINTMENTS BY USER
const getAppointmentsByUser = async (patient_id) => {
  const result = await db.query(
    `SELECT 
        a.*,
        c.clinic_name
     FROM appointment a
     LEFT JOIN clinic c ON a.clinic_id = c.clinic_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patient_id]
  );

  return result.rows;
};

const getAvailableSlots = async (clinicId, date) => {
  // Step 1: Get day of week from the date
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = dayNames[new Date(year, month - 1, day).getDay()];
  const selectedDate = new Date(date);
  
  // Step 2: Get operating hours for that day
  const hoursResult = await db.query(
    `SELECT open_time, close_time, is_closed, slot_capacity
     FROM clinic_operating_hours
     WHERE clinic_id = $1 AND day_of_week = $2`,
    [clinicId, dayOfWeek]
  );

  // No hours configured or clinic is closed that day
  if (hoursResult.rows.length === 0 || hoursResult.rows[0].is_closed) {
    return { slots: [], dayOfWeek };
  }

  const { open_time, close_time, slot_capacity } = hoursResult.rows[0];

  // Step 3: Generate all 30-minute slots between open and close time
  const slots = [];
  const [openHour, openMin] = open_time.slice(0, 5).split(':').map(Number);
  const [closeHour, closeMin] = close_time.slice(0, 5).split(':').map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMin < closeMin)
  ) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);

    // Advance by 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }

  // Step 4: For each slot, count how many confirmed/pending bookings exist
  const bookedResult = await db.query(
    `SELECT appointment_time, COUNT(*) as booking_count
     FROM appointment
     WHERE clinic_id = $1
     AND appointment_date = $2
     AND status IN ('pending', 'confirmed')
     GROUP BY appointment_time`,
    [clinicId, date]
  );

  // Build a map of time -> booking count
  const bookingMap = {};
  bookedResult.rows.forEach(row => {
    const time = row.appointment_time.slice(0, 5);
    bookingMap[time] = parseInt(row.booking_count);
  });

  // Step 5: Filter out fully booked slots
const now = new Date();

const isToday =
  selectedDate.toDateString() === now.toDateString();
  const slotsWithAvailability = slots.map(slot => {

    let available = true;
  
    // Check capacity
    const bookingCount = bookingMap[slot] || 0;
  
    if (bookingCount >= slot_capacity) {
      available = false;
    }
  
    // Prevent past times today
    if (isToday) {
  
      const slotDateTime = new Date(`${date}T${slot}`);
  
      if (slotDateTime <= now) {
        available = false;
      }
    }
  
    return {
      time: slot,
      available
    };
  });

  return { slots: slotsWithAvailability, dayOfWeek };
};

const cancelAppointment = async (appointment_id) => {
  await db.query(
    `UPDATE appointment
     SET status = 'cancelled'
     WHERE appointment_id = $1`,
    [appointment_id]
  );
};

const checkSlotExcludingCurrent = async (
  clinic_id,
  appointment_date,
  appointment_time,
  appointment_id
) => {

  const result = await db.query(
    `SELECT * FROM appointment
     WHERE clinic_id = $1
     AND appointment_date = $2
     AND appointment_time = $3
     AND appointment_id != $4
     AND status IN ('pending', 'confirmed')`,
    [clinic_id, appointment_date, appointment_time, appointment_id]
  );

  return result.rows;
};

const updateAppointmentSlot = async (
  appointment_id,
  appointment_date,
  appointment_time
) => {

  const result = await db.query(
    `UPDATE appointment
     SET appointment_date = $1,
         appointment_time = $2
     WHERE appointment_id = $3
     RETURNING *`,
    [appointment_date, appointment_time, appointment_id]
  );

  return result.rows[0];
};

const getAppointmentsByPhone = async (phone) => {
  const result = await db.query(
    `SELECT 
        a.*,
        c.clinic_name
     FROM appointment a
     LEFT JOIN clinic c ON a.clinic_id = c.clinic_id
     WHERE a.phone_number = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [phone]
  );

  return result.rows;
};

const getUserByEmail = async (email) => {
  const result = await db.query(
    'SELECT user_id FROM "user" WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

module.exports = {
  checkSlot,
  createAppointment,
  getAppointmentsByUser,
  getAvailableSlots,
  cancelAppointment,
  getAppointmentsByPhone,
  getUserByEmail,
  checkSlotExcludingCurrent,
  updateAppointmentSlot
};
