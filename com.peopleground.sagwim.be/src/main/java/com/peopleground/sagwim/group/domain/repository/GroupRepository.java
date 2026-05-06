package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GroupRepository {

    Group save(Group group);

    Optional<Group> findById(Long id);

    Page<Group> findAll(Pageable pageable, String keyword, GroupCategory category);

    Page<Group> findNewGroups(Pageable pageable);

    Page<Group> findPopularGroups(Pageable pageable);

    Page<Group> findByMemberUsername(String username, Pageable pageable);

    // 관리자용: 소프트 삭제 제외, 상태 무관 전체 조회
    Page<Group> findAllForAdmin(Pageable pageable);

    void incrementMemberCount(Long groupId);

    void decrementMemberCount(Long groupId);

    void incrementLikeCount(Long groupId);

    void decrementLikeCount(Long groupId);

    Integer findLikeCountById(Long groupId);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);
}
