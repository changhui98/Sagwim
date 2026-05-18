package com.peopleground.sagwim.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import com.peopleground.sagwim.user.application.AuthService;
import com.peopleground.sagwim.user.application.EmailVerificationService;
import com.peopleground.sagwim.user.presentation.dto.request.EmailResendRequest;
import com.peopleground.sagwim.user.presentation.dto.request.EmailVerifyRequest;
import com.peopleground.sagwim.user.presentation.dto.request.SendVerificationRequest;
import com.peopleground.sagwim.user.presentation.dto.request.UserCreateRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserCreateResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock AuthService authService;
    @Mock EmailVerificationService emailVerificationService;
    @Mock JwtTokenProvider jwtTokenProvider;
    @InjectMocks AuthController controller;

    @Test
    @DisplayName("사용자명 사용 가능 - available=true 반환")
    void checkUsername_available() {
        given(authService.isUsernameAvailable("testuser")).willReturn(true);

        ResponseEntity<?> res = controller.checkUsername("testuser");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("사용자명 이미 사용 중 - available=false 반환")
    void checkUsername_taken() {
        given(authService.isUsernameAvailable("takenuser")).willReturn(false);

        ResponseEntity<?> res = controller.checkUsername("takenuser");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("닉네임 사용 가능 - 200 OK")
    void checkNickname_available() {
        given(authService.isNicknameAvailable("닉네임")).willReturn(true);

        ResponseEntity<?> res = controller.checkNickname("닉네임");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("회원가입 성공 - 201 Created")
    void signUp_success() {
        UUID userId = UUID.randomUUID();
        UserCreateResponse mockResponse = new UserCreateResponse(userId, "newuser", LocalDateTime.now());
        given(authService.signUp(any())).willReturn(mockResponse);

        ResponseEntity<?> res = controller.signUp(new UserCreateRequest("newuser", "Password1!", "닉네임", "user@example.com"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isEqualTo(mockResponse);
    }

    @Test
    @DisplayName("회원가입 - 서비스 예외 발생 시 AppException 전파")
    void signUp_serviceThrows() {
        given(authService.signUp(any())).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.signUp(new UserCreateRequest("dup", "Password1!", "닉네임", "a@b.com")))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("이메일 인증 코드 발송 성공 - 200 OK")
    void sendVerification_success() {
        willDoNothing().given(emailVerificationService).sendVerificationBeforeSignUp(anyString());

        ResponseEntity<?> res = controller.sendVerification(new SendVerificationRequest("user@example.com"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("이메일 인증 코드 발송 - 서비스 예외 전파")
    void sendVerification_serviceThrows() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(emailVerificationService).sendVerificationBeforeSignUp(anyString());

        assertThatThrownBy(() -> controller.sendVerification(new SendVerificationRequest("user@example.com")))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("이메일 인증 성공 - 200 OK")
    void verifyEmail_success() {
        willDoNothing().given(emailVerificationService).verifyCodeBeforeSignUp(anyString(), anyString());

        ResponseEntity<?> res = controller.verifyEmail(new EmailVerifyRequest("user@example.com", "123456"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("이메일 인증 - 잘못된 코드 시 AppException 전파")
    void verifyEmail_wrongCode() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(emailVerificationService).verifyCodeBeforeSignUp(anyString(), anyString());

        assertThatThrownBy(() -> controller.verifyEmail(new EmailVerifyRequest("user@example.com", "000000")))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("이메일 재발송 성공 - 200 OK")
    void resendVerification_success() {
        willDoNothing().given(emailVerificationService).resendCode(anyString());

        ResponseEntity<?> res = controller.resendVerificationEmail(new EmailResendRequest("user@example.com"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("로그아웃 성공 - 204 No Content")
    void signOut_success() {
        HttpServletRequest httpRequest = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(jwtTokenProvider.resolveToken(httpRequest)).willReturn("valid.token");
        willDoNothing().given(authService).signOut("valid.token");

        ResponseEntity<Void> res = controller.signOut(httpRequest);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("로그아웃 - 토큰 없을 시 서비스 예외 전파")
    void signOut_noToken() {
        HttpServletRequest httpRequest = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(jwtTokenProvider.resolveToken(httpRequest)).willReturn(null);
        willThrow(new AppException(ApiErrorCode.UNAUTHORIZED)).given(authService).signOut(null);

        assertThatThrownBy(() -> controller.signOut(httpRequest))
            .isInstanceOf(AppException.class);
    }
}
