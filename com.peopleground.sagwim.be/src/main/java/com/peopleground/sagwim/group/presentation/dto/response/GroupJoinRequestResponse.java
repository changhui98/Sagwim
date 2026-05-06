package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.GroupJoinRequest;
import com.peopleground.sagwim.group.domain.entity.GroupJoinRequestStatus;
import java.time.LocalDateTime;

public record GroupJoinRequestResponse(
    Long requestId,
    String username,
    String nickname,
    GroupJoinRequestStatus status,
    LocalDateTime createdDate,
    String answer
) {
    public static GroupJoinRequestResponse from(GroupJoinRequest r) {
        return new GroupJoinRequestResponse(
            r.getId(),
            r.getUser().getUsername(),
            r.getUser().getNickname(),
            r.getStatus(),
            r.getCreatedDate(),
            r.getAnswer()
        );
    }
}
