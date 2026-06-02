package com.peopleground.sagwim.search.infrastructure.repository;

import com.peopleground.sagwim.search.domain.entity.SearchHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchHistoryJpaRepository extends JpaRepository<SearchHistory, Long> {

    /**
     * PostgreSQL ON CONFLICT 로 동시성-안전 upsert.
     * 동일 (user, type, targetId) 가 이미 있으면 새 행 대신 last_viewed_at 만 NOW() 로 갱신한다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "INSERT INTO p_search_history "
            + "(user_id, target_type, target_id, last_viewed_at, created_date, last_modified_date) "
            + "VALUES (:userId, :targetType, :targetId, NOW(), NOW(), NOW()) "
            + "ON CONFLICT ON CONSTRAINT uk_search_history_user_target "
            + "DO UPDATE SET last_viewed_at = NOW(), last_modified_date = NOW()",
        nativeQuery = true
    )
    void upsert(
        @Param("userId") UUID userId,
        @Param("targetType") String targetType,
        @Param("targetId") String targetId
    );

    /**
     * 반환 컬럼: [0] target_type(String), [1] target_id(String), [2] last_viewed_at(Timestamp/LocalDateTime).
     */
    @Query(
        value = "SELECT target_type, target_id, last_viewed_at "
            + "FROM p_search_history "
            + "WHERE user_id = :userId AND deleted_date IS NULL "
            + "ORDER BY last_viewed_at DESC "
            + "LIMIT :limit",
        nativeQuery = true
    )
    List<Object[]> findRecent(@Param("userId") UUID userId, @Param("limit") int limit);
}
