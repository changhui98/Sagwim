-- V22: 신고(report) 테이블 생성
-- 게시글(POST) / 댓글(COMMENT) / 메시지(MESSAGE, 추후) 신고를 통합 관리한다.
-- (reporter_user_id, target_type, target_id) 유니크 제약으로 중복 신고를 DB 레벨에서 방지.

CREATE TABLE report (
    id                BIGSERIAL PRIMARY KEY,
    reporter_user_id  UUID        NOT NULL,
    target_type       VARCHAR(20) NOT NULL,
    target_id         BIGINT      NOT NULL,
    reason            TEXT        NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_date      TIMESTAMP   NOT NULL,
    last_modified_date TIMESTAMP  NOT NULL,
    deleted_date      TIMESTAMP,

    CONSTRAINT uq_report_reporter_target UNIQUE (reporter_user_id, target_type, target_id)
);

CREATE INDEX idx_report_target_type_id   ON report (target_type, target_id);
CREATE INDEX idx_report_reporter_user_id ON report (reporter_user_id);
CREATE INDEX idx_report_created_date     ON report (created_date DESC);
