-- =====================================================
-- V6: 알림(p_notification) 테이블 생성
-- - 게시글 좋아요/댓글, 모임 가입/일정 등록 등 사용자 활동 알림 저장
-- - 수신자(recipient_id) 기준 최신순 조회와 미읽음 카운트가 핵심 조회 패턴
-- =====================================================
CREATE TABLE IF NOT EXISTS p_notification (
    id                          BIGSERIAL,
    recipient_id                UUID         NOT NULL,
    type                        VARCHAR(50)  NOT NULL,
    actor_nickname              VARCHAR(255) NOT NULL,
    actor_profile_image_url     VARCHAR(500),
    target_id                   BIGINT,
    target_title                VARCHAR(255),
    is_read                     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_date                TIMESTAMP    NOT NULL,
    last_modified_date          TIMESTAMP,
    deleted_date                TIMESTAMP,
    CONSTRAINT pk_notification PRIMARY KEY (id),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES p_user (id)
);

-- 수신자 기준 최신순 조회 + 소프트 삭제 필터 + 읽음 여부 필터를 모두 커버하는 복합 인덱스
-- (recipient_id, deleted_date) 로 활성 알림을 좁히고 created_date DESC 로 정렬한다.
CREATE INDEX IF NOT EXISTS idx_notification_recipient_created
    ON p_notification (recipient_id, created_date DESC)
    WHERE deleted_date IS NULL;

-- 미읽음 카운트 조회용 부분 인덱스 (is_read=false 만 인덱싱하여 인덱스 크기 최소화)
CREATE INDEX IF NOT EXISTS idx_notification_recipient_unread
    ON p_notification (recipient_id)
    WHERE is_read = FALSE AND deleted_date IS NULL;
