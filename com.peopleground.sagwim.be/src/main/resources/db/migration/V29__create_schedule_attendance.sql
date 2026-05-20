CREATE TABLE p_schedule_attendance (
    id           BIGSERIAL PRIMARY KEY,
    schedule_id  BIGINT NOT NULL REFERENCES p_schedule(id) ON DELETE CASCADE,
    user_id      UUID   NOT NULL REFERENCES p_user(id) ON DELETE CASCADE,
    created_date TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_schedule_attendance UNIQUE (schedule_id, user_id)
);

CREATE INDEX idx_schedule_attendance_schedule_id ON p_schedule_attendance(schedule_id);
