package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import java.time.LocalDateTime;

public record AdminGroupResponse(
    Long id,
    String name,
    String description,
    GroupCategory category,
    GroupMeetingType meetingType,
    String region,
    int maxMemberCount,
    int currentMemberCount,
    String leaderNickname,
    String leaderUsername,
    GroupStatus status,
    LocalDateTime createdDate,
    LocalDateTime lastModifiedDate
) {

    public static AdminGroupResponse from(Group group) {
        return new AdminGroupResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            group.getCategory(),
            group.getMeetingType(),
            group.getRegion(),
            group.getMaxMemberCount(),
            group.getCurrentMemberCount(),
            group.getLeader().getNickname(),
            group.getLeader().getUsername(),
            group.getStatus(),
            group.getCreatedDate(),
            group.getLastModifiedDate()
        );
    }
}
