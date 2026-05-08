package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import java.time.LocalDateTime;
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
    public Page<GroupWithLiked> findAll(Pageable pageable, String keyword, GroupCategory category, UUID userId) {
        return groupQueryRepository.findAll(pageable, keyword, category, userId);
    }

    @Override
    public Page<GroupWithLiked> findNewGroups(Pageable pageable, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findNewGroups(pageable, userId, userLocation, exposureRangeKm);
    }

    @Override
    public Page<GroupWithLiked> findPopularGroups(Pageable pageable, UUID userId, Point userLocation, int exposureRangeKm) {
        return groupQueryRepository.findPopularGroups(pageable, userId, userLocation, exposureRangeKm);
    }

    @Override
    public Page<GroupWithLiked> findByMemberUsername(String username, Pageable pageable, UUID userId) {
        return groupQueryRepository.findByMemberUsername(username, pageable, userId);
    }

    @Override
    public Page<Group> findAllForAdmin(Pageable pageable) {
        return groupQueryRepository.findAllForAdmin(pageable);
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
}
