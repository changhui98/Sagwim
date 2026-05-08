package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GroupRepository {

    Group save(Group group);

    Optional<Group> findById(Long id);

    Page<GroupWithLiked> findAll(Pageable pageable, String keyword, GroupCategory category, UUID userId);

    Page<GroupWithLiked> findNewGroups(Pageable pageable, UUID userId, Point userLocation, int exposureRangeKm);

    Page<GroupWithLiked> findPopularGroups(Pageable pageable, UUID userId, Point userLocation, int exposureRangeKm);

    Page<GroupWithLiked> findByMemberUsername(String username, Pageable pageable, UUID userId);

    // 관리자용: 소프트 삭제 제외, 상태 무관 전체 조회
    Page<Group> findAllForAdmin(Pageable pageable);

    // 복원용: 삭제된 그룹 포함 조회
    Optional<Group> findByIdIncludingDeleted(Long id);

    void incrementMemberCount(Long groupId);

    void decrementMemberCount(Long groupId);

    void incrementLikeCount(Long groupId);

    void decrementLikeCount(Long groupId);

    Integer findLikeCountById(Long groupId);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);
}
