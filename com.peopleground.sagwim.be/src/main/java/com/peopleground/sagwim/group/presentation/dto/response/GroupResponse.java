package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import java.time.LocalDateTime;
import java.util.List;

public record GroupResponse(
    Long id,
    String name,
    String description,
    GroupCategory category,
    List<String> subCategories,
    GroupMeetingType meetingType,
    String region,
    int maxMemberCount,
    int currentMemberCount,
    String leaderNickname,
    String leaderUsername,
    LocalDateTime createdDate,
    String imageUrl,
    int likeCount,
    GroupStatus status,
    boolean isLiked
) {

    public static GroupResponse from(Group group) {
        return from(group, group.getImageUrl(), false);
    }

    public static GroupResponse from(Group group, String resolvedImageUrl) {
        return from(group, resolvedImageUrl, false);
    }

    public static GroupResponse from(Group group, String resolvedImageUrl, boolean isLiked) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            group.getCategory(),
            group.getSubCategories(),
            group.getMeetingType(),
            group.getRegion(),
            group.getMaxMemberCount(),
            group.getCurrentMemberCount(),
            group.getLeader().getNickname(),
            group.getLeader().getUsername(),
            group.getCreatedDate(),
            resolvedImageUrl,
            group.getLikeCount(),
            group.getStatus(),
            isLiked
        );
    }
}
