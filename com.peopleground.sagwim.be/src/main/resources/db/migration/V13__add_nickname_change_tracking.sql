ALTER TABLE p_user
    ADD COLUMN nickname_changed_count INT NOT NULL DEFAULT 0,
    ADD COLUMN nickname_changed_at TIMESTAMP;
