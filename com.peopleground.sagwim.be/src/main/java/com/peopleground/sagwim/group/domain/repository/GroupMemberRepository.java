package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.GroupMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GroupMemberRepository {

    GroupMember save(GroupMember groupMember);

    Optional<GroupMember> findByGroupIdAndUsername(Long groupId, String username);

    List<GroupMember> findByGroupId(Long groupId);

    Page<GroupMember> findByGroupId(Long groupId, Pageable pageable);

    boolean existsByGroupIdAndUsername(Long groupId, String username);

    void delete(GroupMember groupMember);

    void deleteAllByGroupId(Long groupId);

    /** LEADER 또는 SUB_LEADER 멤버 목록 조회 (알림 발송용) */
    List<GroupMember> findManagersByGroupId(Long groupId);
}
