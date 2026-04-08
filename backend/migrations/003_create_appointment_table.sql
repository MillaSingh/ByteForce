CREATE TABLE IF NOT EXISTS appointment (
    appointment_id   SERIAL PRIMARY KEY,
    patient_id       INTEGER REFERENCES "user"(user_id) ON DELETE SET NULL,
    clinic_id        INTEGER REFERENCES clinic(clinic_id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason_for_visit VARCHAR(255),
    phone_number     VARCHAR(20),
    medical_aid      VARCHAR(100),
    additional_notes TEXT,
    status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);