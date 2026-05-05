package com.peopleground.sagwim.user.presentation.dto.request;

import com.peopleground.sagwim.user.domain.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record ChangeUserRoleRequest(
    @NotNull(message = "변경할 역할을 입력해주세요.")
    UserRole role
) {
}
