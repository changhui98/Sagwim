package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import lombok.RequiredArgsConstructor;
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
     * 동일 이메일로 가입된 계정이 있으면 409 Conflict를 반환한다.
     */
    @PostMapping("/sign-in")
    public ResponseEntity<SocialSignInResponse> socialSignIn(
        @RequestBody SocialSignInRequest request
    ) {
        SocialSignInResponse response = socialAuthService.socialSignIn(request);
        return ResponseEntity.ok()
            .header("Authorization", response.jwtToken())
            .body(response);
    }

    /**
     * 소셜 계정 연동
     * 409 응답 후 사용자 동의를 받아 기존 계정에 소셜 provider를 연동하고 JWT를 발급한다.
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
