package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupJoinRequest;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GroupJoinRequestJpaRepository extends JpaRepository<GroupJoinRequest, Long> {

    List<GroupJoinRequest> findByGroupIdAndStatus(Long groupId, GroupJoinRequestStatus status);

    @Query("SELECT COUNT(r) > 0 FROM p_group_join_request r WHERE r.group.id = :groupId AND r.user.username = :username AND r.status = :status")
    boolean existsByGroupIdAndUsernameAndStatus(Long groupId, String username, GroupJoinRequestStatus status);
}
