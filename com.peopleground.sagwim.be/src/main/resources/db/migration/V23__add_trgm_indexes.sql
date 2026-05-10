-- flyway:executeInTransaction=false
-- =====================================================
-- V23: pg_trgm GIN 인덱스 추가 (ILIKE 검색 성능 개선)
-- CREATE INDEX CONCURRENTLY 는 트랜잭션 외부에서만 실행 가능하므로
-- flyway:executeInTransaction=false 가 필요합니다.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- p_content.body 검색 (ContentQueryRepository.searchContents)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_body_trgm
    ON p_content USING GIN (body gin_trgm_ops);

-- p_group.name 검색 (GroupQueryRepository.findAll)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_name_trgm
    ON p_group USING GIN (name gin_trgm_ops);

-- p_user.nickname 검색 (UserQueryRepository)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nickname_trgm
    ON p_user USING GIN (nickname gin_trgm_ops);

-- p_user.username 검색 (ContentQueryRepository.searchContents)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_trgm
    ON p_user USING GIN (username gin_trgm_ops);

-- p_tag.name 검색 (TagQueryRepository)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tag_name_trgm
    ON p_tag USING GIN (name gin_trgm_ops);
