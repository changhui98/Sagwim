-- 금지 단어를 활성/비활성(status)으로 관리한다. 활성/비활성과 삭제를 분리하기 위한 변경.
-- 삭제는 하드 딜리트(row 제거)로 처리하므로 soft delete(deleted_date)는 더 이상 사용하지 않는다.
-- 기존 데이터는 전부 제거하고 빈 상태로 시작한다.
DELETE FROM forbidden_word;

ALTER TABLE forbidden_word
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

COMMENT ON COLUMN forbidden_word.status IS '차단 활성 상태: ACTIVE(차단 적용) / INACTIVE(차단 미적용)';
