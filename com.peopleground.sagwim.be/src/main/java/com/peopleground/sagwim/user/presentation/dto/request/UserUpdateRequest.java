package com.peopleground.sagwim.user.presentation.dto.request;

import com.peopleground.sagwim.user.domain.entity.Gender;
import java.time.LocalDate;

public record UserUpdateRequest(
    String nickname,
    String address,
    String currentPassword,
    String newPassword,
    String profileImageUrl,
    String bio,
    Gender gender,
    LocalDate birthDate,
    Boolean isSearchable,
    Integer exposureRangeKm
) {

}
