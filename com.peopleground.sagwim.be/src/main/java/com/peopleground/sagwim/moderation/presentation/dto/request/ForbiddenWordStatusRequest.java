package com.peopleground.sagwim.moderation.presentation.dto.request;

import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWordStatus;
import jakarta.validation.constraints.NotNull;

/**
 * 금지 단어 차단 상태 변경 요청.
 *
 * @param status 변경할 상태 (ACTIVE/INACTIVE)
 */
public record ForbiddenWordStatusRequest(
    @NotNull ForbiddenWordStatus status
) {
}
