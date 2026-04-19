CREATE TABLE IF NOT EXISTS clinic_service (
    service_id   SERIAL PRIMARY KEY,
    clinic_id    INTEGER REFERENCES clinic(clinic_id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL
);