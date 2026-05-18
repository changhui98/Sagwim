package com.peopleground.sagwim.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.user.application.SocialAuthService;
import com.peopleground.sagwim.user.domain.EmailConflictException;
import com.peopleground.sagwim.user.presentation.dto.request.SocialLinkRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SocialSignInRequest;
import com.peopleground.sagwim.user.presentation.dto.response.SocialSignInResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class SocialAuthControllerTest {

    @Mock SocialAuthService socialAuthService;
    @InjectMocks SocialAuthController controller;

    @Test
    @DisplayName("소셜 로그인 성공 - 200 OK + JWT 헤더 포함")
    void socialSignIn_success() {
        SocialSignInRequest req = new SocialSignInRequest("kakao", "authCode", "http://localhost/callback");
        SocialSignInResponse mockRes = new SocialSignInResponse("jwt.token.here", false, "닉네임");
        given(socialAuthService.socialSignIn(req)).willReturn(mockRes);

        ResponseEntity<?> res = controller.socialSignIn(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeaders().getFirst("Authorization")).isEqualTo("jwt.token.here");
    }

    @Test
    @DisplayName("소셜 로그인 - 이메일 충돌 시 409 Conflict")
    void socialSignIn_emailConflict() {
        SocialSignInRequest req = new SocialSignInRequest("google", "authCode", "http://localhost/callback");
        given(socialAuthService.socialSignIn(req))
            .willThrow(new EmailConflictException("access.token", "kakao"));

        ResponseEntity<?> res = controller.socialSignIn(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("소셜 계정 연동 성공 - 200 OK")
    void linkSocialAccount_success() {
        SocialLinkRequest req = new SocialLinkRequest("kakao", "access.token");
        SocialSignInResponse mockRes = new SocialSignInResponse("new.jwt.token", false, "닉네임");
        given(socialAuthService.linkSocialAccount(req)).willReturn(mockRes);

        ResponseEntity<SocialSignInResponse> res = controller.linkSocialAccount(req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeaders().getFirst("Authorization")).isEqualTo("new.jwt.token");
    }

    @Test
    @DisplayName("소셜 계정 연동 - 서비스 예외 전파")
    void linkSocialAccount_serviceThrows() {
        SocialLinkRequest req = new SocialLinkRequest("kakao", "invalid.token");
        given(socialAuthService.linkSocialAccount(req))
            .willThrow(new RuntimeException("연동 실패"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> controller.linkSocialAccount(req))
            .isInstanceOf(RuntimeException.class);
    }
}
