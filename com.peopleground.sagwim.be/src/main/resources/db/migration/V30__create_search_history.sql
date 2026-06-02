CREATE TABLE p_search_history (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            UUID         NOT NULL REFERENCES p_user(id) ON DELETE CASCADE,
    target_type        VARCHAR(20)  NOT NULL,
    target_id          VARCHAR(255) NOT NULL,
    last_viewed_at     TIMESTAMP    NOT NULL,
    created_date       TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_modified_date TIMESTAMP,
    deleted_date       TIMESTAMP,
    CONSTRAINT uk_search_history_user_target UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_search_history_user_viewed ON p_search_history(user_id, last_viewed_at DESC);
