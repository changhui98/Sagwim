-- p_group 테이블에 join_type 컬럼 추가
ALTER TABLE p_group
    ADD COLUMN join_type VARCHAR(30) NOT NULL DEFAULT 'OPEN';

-- 가입 요청 테이블 생성
CREATE TABLE p_group_join_request (
    id                 BIGSERIAL    PRIMARY KEY,
    group_id           BIGINT       NOT NULL,
    user_id            UUID         NOT NULL,
    status             VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    created_date       TIMESTAMP    NOT NULL,
    last_modified_date TIMESTAMP,
    deleted_date       TIMESTAMP,
    CONSTRAINT fk_join_request_group FOREIGN KEY (group_id) REFERENCES p_group (id),
    CONSTRAINT fk_join_request_user  FOREIGN KEY (user_id)  REFERENCES p_user (id),
    CONSTRAINT uk_join_request_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX idx_join_request_group_status ON p_group_join_request (group_id, status);
