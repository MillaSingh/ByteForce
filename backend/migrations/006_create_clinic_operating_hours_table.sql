CREATE TABLE IF NOT EXISTS clinic_operating_hours (
    hours_id      SERIAL PRIMARY KEY,
    clinic_id     INTEGER REFERENCES clinic(clinic_id) ON DELETE CASCADE,
    day_of_week   VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    open_time     TIME,
    close_time    TIME,
    is_closed     BOOLEAN DEFAULT FALSE,
    slot_capacity INTEGER DEFAULT 1,
    UNIQUE (clinic_id, day_of_week)
);