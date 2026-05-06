package com.peopleground.sagwim.user.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminDeleteUserRequest(
    @NotBlank(message = "삭제 사유를 입력해주세요.")
    @Size(max = 500, message = "삭제 사유는 500자 이하로 입력해주세요.")
    String reason
) {
}
