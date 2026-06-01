package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.ContentLike;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 게시글 좋아요(p_content_like)와 모임 좋아요(p_group_like)를 UNION 으로 합쳐
 * 좋아요 시각 기준으로 통합 페이지네이션 조회한다.
 *
 * <p>JPQL 은 UNION 을 지원하지 않으므로 native query 로 작성한다. 라벨(본문/이름)은
 * 여기서 조회하지 않고 type+target_id 만 내려, 호출부가 배치 조회로 조립해 N+1 을 피한다.</p>
 */
public interface LikedActivityJpaRepository extends JpaRepository<ContentLike, Long> {

    /**
     * 반환 컬럼 순서: [0] type(String), [1] target_id(Number), [2] liked_at(Timestamp).
     * liked_at 동률 시 type, target_id 로 안정 정렬하여 offset 페이지네이션 경계를 고정한다.
     */
    @Query(value = """
        SELECT m.type AS type, m.target_id AS target_id, m.liked_at AS liked_at
        FROM (
            SELECT 'POST' AS type, cl.content_id AS target_id, cl.created_date AS liked_at
            FROM p_content_like cl
            JOIN p_content c ON c.id = cl.content_id AND c.deleted_date IS NULL
            WHERE cl.user_id = :userId
            UNION ALL
            SELECT 'GROUP' AS type, gl.group_id AS target_id, gl.created_date AS liked_at
            FROM p_group_like gl
            JOIN p_group g ON g.id = gl.group_id AND g.deleted_date IS NULL
            WHERE gl.user_id = :userId
        ) m
        ORDER BY m.liked_at DESC, m.type ASC, m.target_id DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Object[]> findLikedActivities(
        @Param("userId") UUID userId,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
}
