package com.peopleground.sagwim.search.presentation.dto.request;

import com.peopleground.sagwim.search.domain.entity.SearchTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 최근 검색 기록 저장 요청.
 * type: USER/POST/GROUP, targetId: USER 면 username, POST/GROUP 이면 id 문자열.
 */
public record SearchHistoryRequest(
    @NotNull SearchTargetType type,
    @NotBlank String targetId
) {
}
