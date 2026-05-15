-- 기존 전체 유니크 제약은 소프트 삭제된 row까지 word를 차지해서,
-- 같은 단어를 삭제 후 재등록할 때 unique violation 이 발생한다.
-- 활성 단어(deleted_date IS NULL) 사이에서만 유일성을 강제하는 partial unique index 로 교체한다.
ALTER TABLE forbidden_word DROP CONSTRAINT IF EXISTS uq_forbidden_word_word;

CREATE UNIQUE INDEX uq_forbidden_word_word_active
    ON forbidden_word (word)
    WHERE deleted_date IS NULL;

COMMENT ON INDEX uq_forbidden_word_word_active IS '활성 금지 단어(soft delete 제외) 사이에서만 word 유일성을 강제';
