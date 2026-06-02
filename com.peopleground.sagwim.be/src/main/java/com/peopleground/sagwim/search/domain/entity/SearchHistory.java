package com.peopleground.sagwim.search.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 최근 검색 기록.
 *
 * <p>검색 결과에서 항목(유저/게시글/모임)을 눌러 상세로 진입한 경우 해당 항목을 기록한다.
 * (user, targetType, targetId) 유니크 — 같은 항목을 다시 보면 새 행이 아니라 lastViewedAt 만 갱신한다.
 * targetId 는 USER 면 username, POST/GROUP 이면 각 id 의 문자열이다.</p>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_search_history")
@Table(
    name = "p_search_history",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_search_history_user_target",
        columnNames = {"user_id", "target_type", "target_id"}
    ),
    indexes = @Index(name = "idx_search_history_user_viewed", columnList = "user_id, last_viewed_at")
)
public class SearchHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private SearchTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private String targetId;

    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;
}
