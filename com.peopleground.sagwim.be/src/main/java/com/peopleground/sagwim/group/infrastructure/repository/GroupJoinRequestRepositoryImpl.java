package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinRequest;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequestStatus;
import com.peopleground.sagwim.group.domain.repository.GroupJoinRequestRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupJoinRequestRepositoryImpl implements GroupJoinRequestRepository {

    private final GroupJoinRequestJpaRepository jpaRepository;

    @Override
    public GroupJoinRequest save(GroupJoinRequest request) {
        return jpaRepository.save(request);
    }

    @Override
    public Optional<GroupJoinRequest> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<GroupJoinRequest> findByGroupIdAndStatus(Long groupId, GroupJoinRequestStatus status) {
        return jpaRepository.findByGroupIdAndStatus(groupId, status);
    }

    @Override
    public boolean existsByGroupIdAndUsernameAndStatus(Long groupId, String username, GroupJoinRequestStatus status) {
        return jpaRepository.existsByGroupIdAndUsernameAndStatus(groupId, username, status);
    }

    @Override
    public Optional<GroupJoinRequest> findByGroupIdAndUsernameAndStatus(Long groupId, String username, GroupJoinRequestStatus status) {
        return jpaRepository.findByGroupIdAndUserUsernameAndStatus(groupId, username, status);
    }

    @Override
    public void delete(GroupJoinRequest request) {
        jpaRepository.delete(request);
    }
}
