package com.peopleground.sagwim.user.presentation.dto.request;

public record UserUpdateRequest(
    String nickname,
    String address,
    String currentPassword,
    String newPassword,
    String profileImageUrl
) {

}
