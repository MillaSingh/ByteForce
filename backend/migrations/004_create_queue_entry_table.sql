CREATE TABLE IF NOT EXISTS queue_entry (
    queue_id       SERIAL PRIMARY KEY,
    clinic_id      INTEGER REFERENCES clinic(clinic_id) ON DELETE SET NULL,
    patient_id     INTEGER REFERENCES "user"(user_id) ON DELETE SET NULL,
    appointment_id INTEGER REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    queue_position INTEGER,
    status         VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_consultation', 'complete')),
    check_in_time  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_time    TIMESTAMP,
    complete_time  TIMESTAMP
);