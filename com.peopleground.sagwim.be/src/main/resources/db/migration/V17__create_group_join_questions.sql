CREATE TABLE p_group_join_question (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES p_group(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP
);

ALTER TABLE p_group DROP COLUMN IF EXISTS join_question;
