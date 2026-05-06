CREATE TABLE delete_log (
    id              BIGSERIAL       PRIMARY KEY,
    deleted_by      VARCHAR(50)     NOT NULL,
    target_type     VARCHAR(20)     NOT NULL,
    target_id       VARCHAR(100)    NOT NULL,
    target_summary  VARCHAR(255)    NOT NULL,
    reason          VARCHAR(500),
    deleted_at      TIMESTAMP       NOT NULL,
    restored        BOOLEAN         NOT NULL DEFAULT FALSE,
    restored_at     TIMESTAMP,
    restored_by     VARCHAR(50)
);

CREATE INDEX idx_delete_log_deleted_at  ON delete_log (deleted_at DESC);
CREATE INDEX idx_delete_log_target_type ON delete_log (target_type);
