package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupRepositoryImpl implements GroupRepository {

    private final GroupJpaRepository groupJpaRepository;
    private final GroupQueryRepository groupQueryRepository;

    @Override
    public Group save(Group group) {
        return groupJpaRepository.save(group);
    }

    @Override
    public Optional<Group> findById(Long id) {
        return groupQueryRepository.findById(id);
    }

    @Override
    public List<GroupWithLiked> findAll(int page, int size, String keyword, GroupCategory category, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findAll(page, size, keyword, category, userId, userLocation, exposureRangeKm);
    }

    @Override
    public List<GroupWithLiked> findNewGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findNewGroups(page, size, userId, userLocation, exposureRangeKm);
    }

    @Override
    public List<GroupWithLiked> findPopularGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findPopularGroups(page, size, userId, userLocation, exposureRangeKm);
    }

    @Override
    public List<GroupWithLiked> findDeadlineGroups(int page, int size, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findDeadlineGroups(page, size, userId, userLocation, exposureRangeKm);
    }

    @Override
    public List<GroupWithLiked> findByMemberUsername(String username, int page, int size, UUID userId) {
        return groupQueryRepository.findByMemberUsername(username, page, size, userId);
    }

    @Override
    public Page<Group> findAllForAdmin(String keyword, Pageable pageable) {
        return groupQueryRepository.findAllForAdmin(keyword, pageable);
    }

    @Override
    public Optional<Group> findByIdIncludingDeleted(Long id) {
        return groupJpaRepository.findById(id);
    }

    @Override
    public void incrementMemberCount(Long groupId) {
        groupJpaRepository.incrementMemberCount(groupId);
    }

    @Override
    public void decrementMemberCount(Long groupId) {
        groupJpaRepository.decrementMemberCount(groupId);
    }

    @Override
    public void incrementLikeCount(Long groupId) {
        groupJpaRepository.incrementLikeCount(groupId);
    }

    @Override
    public void decrementLikeCount(Long groupId) {
        groupJpaRepository.decrementLikeCount(groupId);
    }

    @Override
    public Integer findLikeCountById(Long groupId) {
        return groupJpaRepository.findLikeCountById(groupId);
    }

    @Override
    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {
        return groupQueryRepository.countMonthlyCreations(windowStart);
    }

    @Override
    public List<GroupWithLiked> findAllByIds(List<Long> ids, UUID userId) {
        return groupQueryRepository.findAllByIds(ids, userId);
    }
}
