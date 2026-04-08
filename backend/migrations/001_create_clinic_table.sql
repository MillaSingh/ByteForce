CREATE TABLE IF NOT EXISTS clinic (
    clinic_id          SERIAL PRIMARY KEY,
    clinic_name        VARCHAR(255) NOT NULL,
    province           VARCHAR(100),
    district           VARCHAR(100),
    municipality       VARCHAR(100),
    org_unit_type      VARCHAR(100),
    service_point_type VARCHAR(100),
    rural_urban        VARCHAR(50),
    closed_date        DATE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);