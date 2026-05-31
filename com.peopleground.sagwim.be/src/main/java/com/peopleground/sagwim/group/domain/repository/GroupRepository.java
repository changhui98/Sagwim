package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GroupRepository {

    Group save(Group group);

    Optional<Group> findById(Long id);

    /**
     * 무한스크롤용 모임 목록. COUNT 쿼리 없이 size+1 방식으로 hasNext를 판단한다.
     */
    List<GroupWithLiked> findAll(int page, int size, String keyword, GroupCategory category, UUID userId, Point userLocation, int exposureRangeKm);

    /**
     * 무한스크롤용 신규 모임 목록. COUNT 쿼리 없이 size+1 방식.
     */
    List<GroupWithLiked> findNewGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm);

    /**
     * 무한스크롤용 인기 모임 목록. COUNT 쿼리 없이 size+1 방식.
     */
    List<GroupWithLiked> findPopularGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm);

    /**
     * 무한스크롤용 마감 임박(정원 임박) 모임 목록. COUNT 쿼리 없이 size+1 방식.
     */
    List<GroupWithLiked> findDeadlineGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm);

    /**
     * 무한스크롤용 내 모임 목록. COUNT 쿼리 없이 size+1 방식.
     */
    List<GroupWithLiked> findByMemberUsername(String username, int page, int size, UUID userId);

    // 관리자용: 소프트 삭제 제외, 상태 무관 전체 조회 (COUNT 쿼리 유지)
    Page<Group> findAllForAdmin(Pageable pageable);

    // 복원용: 삭제된 그룹 포함 조회
    Optional<Group> findByIdIncludingDeleted(Long id);

    void incrementMemberCount(Long groupId);

    void decrementMemberCount(Long groupId);

    void incrementLikeCount(Long groupId);

    void decrementLikeCount(Long groupId);

    Integer findLikeCountById(Long groupId);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);

    /**
     * id 목록으로 모임 일괄 조회. 이번 주 일정 모임 등 IN 쿼리용.
     */
    List<GroupWithLiked> findAllByIds(List<Long> ids, UUID userId);
}
