package com.peopleground.sagwim.user.presentation.dto.response;

/**
 * 이메일 중복(409) 응답 바디.
 *
 * <p>sign-in 단계에서 이미 교환한 OAuth accessToken과 provider를 포함하여 반환한다.
 * 프론트엔드는 이 값을 보관했다가 link 엔드포인트 호출 시 재사용한다.</p>
 */
public record EmailConflictResponse(
    String code,
    String message,
    String accessToken,
    String provider
) {}
