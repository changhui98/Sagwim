-- =====================================================
-- V24: pg_trgm GIN 인덱스 추가 (ILIKE 검색 성능 개선)
-- pg_trgm 확장은 V23 에서 활성화되어 있다.
-- dev/CI 환경 호환을 위해 CONCURRENTLY 미사용 (테이블 락은 짧다).
-- prod 운영 시에는 별도 운영 도구로 CONCURRENTLY 적용을 권장.
-- =====================================================

-- p_content.body 검색 (ContentQueryRepository.searchContents)
CREATE INDEX IF NOT EXISTS idx_content_body_trgm
    ON p_content USING GIN (body gin_trgm_ops);

-- p_group.name 검색 (GroupQueryRepository.findAll)
CREATE INDEX IF NOT EXISTS idx_group_name_trgm
    ON p_group USING GIN (name gin_trgm_ops);

-- p_user.nickname 검색 (UserQueryRepository)
CREATE INDEX IF NOT EXISTS idx_user_nickname_trgm
    ON p_user USING GIN (nickname gin_trgm_ops);

-- p_user.username 검색 (ContentQueryRepository.searchContents)
CREATE INDEX IF NOT EXISTS idx_user_username_trgm
    ON p_user USING GIN (username gin_trgm_ops);

-- p_tag.name 검색 (TagQueryRepository)
CREATE INDEX IF NOT EXISTS idx_tag_name_trgm
    ON p_tag USING GIN (name gin_trgm_ops);
