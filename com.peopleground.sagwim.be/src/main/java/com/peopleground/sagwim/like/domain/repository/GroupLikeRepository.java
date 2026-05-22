package com.peopleground.sagwim.like.domain.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.like.domain.entity.GroupLike;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface GroupLikeRepository {

    GroupLike save(GroupLike groupLike);

    Optional<GroupLike> findByGroupIdAndUserId(Long groupId, UUID userId);

    boolean existsByGroupIdAndUserId(Long groupId, UUID userId);

    void delete(GroupLike groupLike);

    /**
     * 동시성-안전 좋아요 삽입. UNIQUE (group_id, user_id) 경합이 발생해도
     * 예외 없이 실제 삽입된 행 수(0 또는 1)를 반환한다.
     */
    int insertIfNotExists(Long groupId, UUID userId);

    List<GroupLike> findByGroupId(Long groupId);

    /**
     * 내 활동: 특정 사용자가 좋아요를 누른 모임 목록을 최신순으로 페이지 조회한다.
     * COUNT 쿼리 없이 size+1 방식으로 hasNext 를 판단한다.
     */
    List<Group> findLikedGroupsByUserId(UUID userId, int page, int size);
}
