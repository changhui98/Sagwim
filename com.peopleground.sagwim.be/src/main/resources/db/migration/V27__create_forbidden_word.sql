CREATE TABLE forbidden_word (
    id BIGSERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    created_by_username VARCHAR(255) NULL,
    created_date TIMESTAMP NOT NULL,
    last_modified_date TIMESTAMP,
    deleted_date TIMESTAMP,
    CONSTRAINT uq_forbidden_word_word UNIQUE (word)
);

CREATE INDEX idx_forbidden_word_deleted ON forbidden_word (deleted_date) WHERE deleted_date IS NULL;

COMMENT ON TABLE forbidden_word IS '관리자 등록 금지 단어 (부적절 표현 필터링용)';
COMMENT ON COLUMN forbidden_word.word IS '저장 시 정규화(NFKC + 소문자 + 공백 제거 + NFD)된 형태';
COMMENT ON COLUMN forbidden_word.created_by_username IS '등록한 관리자 username (NULL=시드 또는 레거시 데이터)';
