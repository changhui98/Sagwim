package com.peopleground.sagwim.user.presentation.dto.response;

import com.peopleground.sagwim.user.domain.entity.Gender;
import com.peopleground.sagwim.user.domain.entity.OAuthProvider;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserDetailResponse(
    UUID id,
    String username,
    String nickname,
    String userEmail,
    String address,
    UserRole role,
    String profileImageUrl,
    OAuthProvider provider,
    String bio,
    Gender gender,
    LocalDate birthDate,
    boolean isSearchable,
    int exposureRangeKm,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {

    public static UserDetailResponse from(User user) {
        return from(user, user.getProfileImageUrl());
    }

    public static UserDetailResponse from(User user, String resolvedProfileImageUrl) {
        return new UserDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getNickname(),
            user.getUserEmail(),
            user.getAddress(),
            user.getRole(),
            resolvedProfileImageUrl,
            user.getProvider(),
            user.getBio(),
            user.getGender(),
            user.getBirthDate(),
            user.isSearchable(),
            user.getExposureRangeKm(),
            user.getCreatedDate(),
            user.getLastModifiedDate()
        );
    }

}
