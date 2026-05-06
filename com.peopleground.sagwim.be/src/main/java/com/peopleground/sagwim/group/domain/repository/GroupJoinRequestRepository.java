package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinRequest;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequestStatus;
import java.util.List;
import java.util.Optional;

public interface GroupJoinRequestRepository {
    GroupJoinRequest save(GroupJoinRequest request);
    Optional<GroupJoinRequest> findById(Long id);
    List<GroupJoinRequest> findByGroupIdAndStatus(Long groupId, GroupJoinRequestStatus status);
    boolean existsByGroupIdAndUsernameAndStatus(Long groupId, String username, GroupJoinRequestStatus status);
}
