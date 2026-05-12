-- V26: 문의(inquiry) 테이블 생성
-- 회원 탈퇴 사유, 일반 문의 등 사용자 피드백을 통합 관리한다.
-- source 컬럼으로 유입 경로(WITHDRAWAL / INQUIRY)를 구분한다.
-- 작성자 정보는 user_id 외에 username/nickname 을 snapshot 으로 저장하여
-- 사용자가 영구 삭제되더라도 작성자 식별이 가능하도록 한다.

CREATE TABLE inquiry (
    id                  BIGSERIAL   PRIMARY KEY,
    source              VARCHAR(20) NOT NULL,
    content             TEXT        NOT NULL,
    author_user_id      UUID,
    author_username     VARCHAR(50),
    author_nickname     VARCHAR(50),
    created_date        TIMESTAMP   NOT NULL,
    last_modified_date  TIMESTAMP   NOT NULL,
    deleted_date        TIMESTAMP
);

CREATE INDEX idx_inquiry_source        ON inquiry (source);
CREATE INDEX idx_inquiry_created_date  ON inquiry (created_date DESC);
CREATE INDEX idx_inquiry_author_user_id ON inquiry (author_user_id);
