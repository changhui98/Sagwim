package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.domain.EmailConflictException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.EmailConflictResponse;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

    private final SocialAuthService socialAuthService;

    /**
     * 소셜 로그인 (카카오 / 구글)
     * Authorization 헤더로 JWT 토큰을 반환한다.
     * 동일 이메일로 가입된 계정이 있으면 409 Conflict를 반환하며,
     * 바디에 sign-in 단계에서 교환한 accessToken과 provider를 포함한다.
     * 프론트엔드는 이를 보관했다가 /link 호출 시 재사용하여 code 재사용(invalid_grant)을 방지한다.
     */
    @PostMapping("/sign-in")
    public ResponseEntity<?> socialSignIn(
        @RequestBody SocialSignInRequest request
    ) {
        try {
            SocialSignInResponse response = socialAuthService.socialSignIn(request);
            return ResponseEntity.ok()
                .header("Authorization", response.jwtToken())
                .body(response);
        } catch (EmailConflictException e) {
            UserErrorCode errorCode = UserErrorCode.EMAIL_ALREADY_EXISTS_WITH_DIFFERENT_PROVIDER;
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new EmailConflictResponse(
                    errorCode.getCode(),
                    errorCode.getMessage(),
                    e.getAccessToken(),
                    e.getProvider()
                ));
        }
    }

    /**
     * 소셜 계정 연동
     * 409 응답 후 사용자 동의를 받아 기존 계정에 소셜 provider를 연동하고 JWT를 발급한다.
     * code 대신 409 바디에서 받은 accessToken을 그대로 전달한다.
     */
    @PostMapping("/link")
    public ResponseEntity<SocialSignInResponse> linkSocialAccount(
        @RequestBody SocialLinkRequest request
    ) {
        SocialSignInResponse response = socialAuthService.linkSocialAccount(request);
        return ResponseEntity.ok()
            .header("Authorization", response.jwtToken())
            .body(response);
    }
}
