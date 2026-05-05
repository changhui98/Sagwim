package com.peopleground.sagwim.user.domain;

import lombok.Getter;

/**
 * 동일 이메일로 가입된 계정이 있을 때 던지는 예외.
 *
 * <p>sign-in 단계에서 이미 교환한 OAuth accessToken을 함께 보존하여,
 * 컨트롤러가 409 응답 바디에 포함할 수 있도록 한다.
 * code 재사용으로 인한 invalid_grant 방지가 목적이다.</p>
 */
@Getter
public class EmailConflictException extends RuntimeException {

    private final String accessToken;
    private final String provider;

    public EmailConflictException(String accessToken, String provider) {
        super(UserErrorCode.EMAIL_ALREADY_EXISTS_WITH_DIFFERENT_PROVIDER.getMessage());
        this.accessToken = accessToken;
        this.provider = provider;
    }
}
