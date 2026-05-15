CREATE TABLE IF NOT EXISTS staff_profile (
    staff_profile_id SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
    clinic_id        INTEGER REFERENCES clinic(clinic_id) ON DELETE SET NULL,
    job_title        VARCHAR(100),
    specialties      TEXT
);