const pool = require('../db');

const getAnalytics = async (clinicId) => {
  const today = new Date().toISOString().split('T')[0];

  const [
    todayResult,
    totalResult,
    noShowResult,
    waitResult,
    weeklyResult,
    statusResult,
    recentResult,
    noShowByDayResult,    // NEW
    waitByDayResult       // NEW
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM appointment
       WHERE clinic_id = $1 AND appointment_date = $2`,
      [clinicId, today]
    ),
    pool.query(
      `SELECT COUNT(*) FROM appointment WHERE clinic_id = $1`,
      [clinicId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'confirmed' AND appointment_date < $2) AS no_shows,
         COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed', 'cancelled')) AS total_resolved
       FROM appointment
       WHERE clinic_id = $1`,
      [clinicId, today]
    ),
    pool.query(
      `SELECT AVG(
         EXTRACT(EPOCH FROM (called_time - check_in_time)) / 60
       ) AS avg_wait
       FROM queue_entry
       WHERE clinic_id = $1
       AND check_in_time IS NOT NULL
       AND called_time IS NOT NULL
       AND called_time > check_in_time
       AND EXTRACT(EPOCH FROM (called_time - check_in_time)) / 60 < 240`,
      [clinicId]
    ),
    pool.query(
      `SELECT appointment_date::text AS day, COUNT(*) AS count
       FROM appointment
       WHERE clinic_id = $1
       AND appointment_date >= CURRENT_DATE - INTERVAL '6 days'
       AND appointment_date <= CURRENT_DATE
       GROUP BY appointment_date
       ORDER BY appointment_date ASC`,
      [clinicId]
    ),
    pool.query(
      `SELECT status, COUNT(*) AS count
       FROM appointment
       WHERE clinic_id = $1
       GROUP BY status
       ORDER BY count DESC`,
      [clinicId]
    ),
    pool.query(
      `SELECT a.appointment_id, a.appointment_date, a.appointment_time,
              a.reason_for_visit, a.status,
              u.first_name, u.last_name
       FROM appointment a
       LEFT JOIN "user" u ON a.patient_id = u.user_id
       WHERE a.clinic_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT 20`,
      [clinicId]
    ),
    // NEW: no-show rate per day of week (open days only)
    pool.query(
      `SELECT
         EXTRACT(DOW FROM a.appointment_date) AS day_num,
         TRIM(TO_CHAR(a.appointment_date, 'Day')) AS day_name,
         COUNT(*) FILTER (WHERE a.status = 'confirmed' AND a.appointment_date < CURRENT_DATE) AS no_shows,
         COUNT(*) FILTER (WHERE a.status IN ('confirmed', 'completed', 'cancelled')) AS total
       FROM appointment a
       JOIN clinic_operating_hours h
         ON h.clinic_id = a.clinic_id
         AND TRIM(TO_CHAR(a.appointment_date, 'Day')) = h.day_of_week
         AND h.is_closed = false
       WHERE a.clinic_id = $1
       GROUP BY EXTRACT(DOW FROM a.appointment_date), TRIM(TO_CHAR(a.appointment_date, 'Day'))
       ORDER BY EXTRACT(DOW FROM a.appointment_date)`,
      [clinicId]
    ),
    // NEW: avg wait time per day of week (open days only)
    pool.query(
      `SELECT
         EXTRACT(DOW FROM q.check_in_time) AS day_num,
         TRIM(TO_CHAR(q.check_in_time, 'Day')) AS day_name,
         ROUND(AVG(EXTRACT(EPOCH FROM (q.called_time - q.check_in_time)) / 60)::numeric, 1) AS avg_wait
       FROM queue_entry q
       JOIN clinic_operating_hours h
         ON h.clinic_id = q.clinic_id
         AND TRIM(TO_CHAR(q.check_in_time, 'Day')) = h.day_of_week
         AND h.is_closed = false
       WHERE q.clinic_id = $1
       AND q.check_in_time IS NOT NULL
       AND q.called_time IS NOT NULL
       AND q.called_time > q.check_in_time
       AND EXTRACT(EPOCH FROM (q.called_time - q.check_in_time)) / 60 < 240
       GROUP BY EXTRACT(DOW FROM q.check_in_time), TRIM(TO_CHAR(q.check_in_time, 'Day'))
       ORDER BY EXTRACT(DOW FROM q.check_in_time)`,
      [clinicId]
    )
  ]);

  const noShows = parseInt(noShowResult.rows[0].no_shows);
  const totalResolved = parseInt(noShowResult.rows[0].total_resolved);
  const noShowRate = totalResolved > 0
    ? Math.round((noShows / totalResolved) * 100)
    : 0;

  const avgWaitMinutes = waitResult.rows[0].avg_wait
    ? Math.round(parseFloat(waitResult.rows[0].avg_wait))
    : null;

  const weeklyMap = {};
  weeklyResult.rows.forEach(row => {
    weeklyMap[row.day] = parseInt(row.count);
  });

  const weeklyAppointments = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toISOString().split('T')[0];
    weeklyAppointments.push({
      day: dayStr,
      count: weeklyMap[dayStr] || 0
    });
  }

  const statusBreakdown = statusResult.rows.map(row => ({
    status: row.status,
    count: parseInt(row.count)
  }));

  // Process no-show by day
  const noShowByDay = noShowByDayResult.rows.map(row => ({
    day: row.day_name,
    rate: row.total > 0
      ? Math.round((parseInt(row.no_shows) / parseInt(row.total)) * 100)
      : 0
  }));

  // Process wait time by day
  const waitByDay = waitByDayResult.rows.map(row => ({
    day: row.day_name,
    avgWait: parseFloat(row.avg_wait) || 0
  }));

  return {
    appointmentsToday: parseInt(todayResult.rows[0].count),
    totalAppointments: parseInt(totalResult.rows[0].count),
    noShowRate,
    avgWaitMinutes,
    weeklyAppointments,
    statusBreakdown,
    recentAppointments: recentResult.rows,
    noShowByDay,
    waitByDay
  };
};

module.exports = { getAnalytics };