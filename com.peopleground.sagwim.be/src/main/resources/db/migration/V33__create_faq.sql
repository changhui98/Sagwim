-- V33: FAQ(자주 묻는 질문) 테이블 생성
-- 관리자가 등록한 자주 묻는 질문을 저장하고, 클라이언트 /faq 페이지에서 노출한다.
-- published=TRUE 인 항목만 공개되며, display_order 오름차순으로 정렬한다.

CREATE TABLE faq (
    id                  BIGSERIAL    PRIMARY KEY,
    question            VARCHAR(255) NOT NULL,
    answer              TEXT         NOT NULL,
    display_order       INT          NOT NULL DEFAULT 0,
    published           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_date        TIMESTAMP    NOT NULL,
    last_modified_date  TIMESTAMP,
    deleted_date        TIMESTAMP
);

-- 공개 목록 조회(published + display_order 정렬)에 사용
CREATE INDEX idx_faq_published_order ON faq (published, display_order, id);
