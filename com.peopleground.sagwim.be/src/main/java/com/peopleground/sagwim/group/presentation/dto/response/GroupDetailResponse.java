package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupJoinQuestion;
import com.peopleground.sagwim.group.domain.entity.GroupJoinType;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import java.time.LocalDateTime;
import java.util.List;

public record GroupDetailResponse(
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
    GroupJoinType joinType,
    List<String> joinQuestions,
    List<GroupMemberResponse> members
) {

    public static GroupDetailResponse of(Group group, List<GroupMemberResponse> members) {
        return of(group, group.getImageUrl(), members, List.of());
    }

    public static GroupDetailResponse of(
        Group group,
        String resolvedImageUrl,
        List<GroupMemberResponse> members,
        List<GroupJoinQuestion> joinQuestions
    ) {
        return new GroupDetailResponse(
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
            group.getJoinType(),
            joinQuestions.stream().map(GroupJoinQuestion::getQuestion).toList(),
            members
        );
    }
}
