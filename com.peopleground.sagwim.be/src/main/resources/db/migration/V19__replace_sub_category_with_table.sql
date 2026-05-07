-- 기존 단일 컬럼 제거
ALTER TABLE p_group DROP COLUMN sub_category;

-- 세부 분야 전용 테이블 생성
CREATE TABLE group_sub_category (
    group_id BIGINT NOT NULL REFERENCES p_group(id) ON DELETE CASCADE,
    sub_category VARCHAR(100) NOT NULL
);
