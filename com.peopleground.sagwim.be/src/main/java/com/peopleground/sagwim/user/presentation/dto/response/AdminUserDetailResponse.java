package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.Gender;
import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminUserDetailResponse(
    UUID id,
    String username,
    String nickname,
    String userEmail,
    UserRole role,
    OAuthProvider provider,
    String address,
    String profileImageUrl,
    String bio,
    Gender gender,
    LocalDate birthDate,
    boolean isSearchable,
    int exposureRangeKm,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    boolean isDeleted,
    LocalDateTime deletedAt
) {
    public static AdminUserDetailResponse from(User user) {
        return from(user, user.getProfileImageUrl());
    }

    public static AdminUserDetailResponse from(User user, String resolvedProfileImageUrl) {
        return new AdminUserDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getUserEmail(),
            user.getRole(),
            user.getProvider(),
            user.getAddress(),
            resolvedProfileImageUrl,
            user.getBio(),
            user.getGender(),
            user.getBirthDate(),
            user.isSearchable(),
            user.getExposureRangeKm(),
            user.getCreatedDate(),
            user.getLastModifiedDate(),
            user.isDeleted(),
            user.getDeletedDate()
        );
    }
}
