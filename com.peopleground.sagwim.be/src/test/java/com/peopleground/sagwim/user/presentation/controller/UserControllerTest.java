package com.peopleground.sagwim.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.application.EmailVerificationService;
import com.peopleground.sagwim.user.application.UserService;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import com.peopleground.sagwim.user.presentation.dto.request.EmailChangeConfirmRequest;
import com.peopleground.sagwim.user.presentation.dto.request.EmailChangeRequest;
import com.peopleground.sagwim.user.presentation.dto.request.UserUpdateRequest;
import com.peopleground.sagwim.user.presentation.dto.request.UserWithdrawRequest;
import com.peopleground.sagwim.user.presentation.dto.response.UserDetailResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock UserService userService;
    @Mock EmailVerificationService emailVerificationService;
    @InjectMocks UserController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    private UserDetailResponse mockDetail() {
        return new UserDetailResponse(user.getId(), "testuser", "닉네임", "a@b.com",
            null, UserRole.USER, null, null, null, null, null, true, 5, null, null);
    }

    @Test
    @DisplayName("사용자 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getUsers_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(userService.getUsers(0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getUsers(0, 10);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("사용자 목록 조회 - 서비스 예외 전파")
    void getUsers_serviceThrows() {
        given(userService.getUsers(0, 10)).willThrow(new AppException(ApiErrorCode.FORBIDDEN));

        assertThatThrownBy(() -> controller.getUsers(0, 10))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("사용자 검색 성공")
    @SuppressWarnings("unchecked")
    void searchUsers_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(userService.searchUsers(anyString(), eq(0), eq(10))).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.searchUsers("keyword", 0, 10);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("내 프로필 조회 성공")
    void getMyProfile_success() {
        given(userService.getMyProfile(user)).willReturn(mockDetail());

        ResponseEntity<UserDetailResponse> res = controller.getMyProfile(user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("내 프로필 조회 - 사용자 없으면 AppException 전파")
    void getMyProfile_notFound() {
        given(userService.getMyProfile(user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getMyProfile(user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("username으로 프로필 조회 성공")
    void getProfileByUsername_success() {
        given(userService.getProfileByUsername("testuser")).willReturn(mockDetail());

        ResponseEntity<UserDetailResponse> res = controller.getProfileByUsername("testuser");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("username으로 프로필 조회 - 없는 유저면 예외 전파")
    void getProfileByUsername_notFound() {
        given(userService.getProfileByUsername("noone")).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getProfileByUsername("noone"))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("프로필 수정 성공")
    void updateProfile_success() {
        UserUpdateRequest req = new UserUpdateRequest("newNick", null, null, null, null, null, null, null, null, null);
        given(userService.updateProfile(user, req)).willReturn(mockDetail());

        ResponseEntity<UserDetailResponse> res = controller.updateProfile(user, req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("회원 탈퇴 성공 - 204 No Content")
    void deleteUser_success() {
        willDoNothing().given(userService).deleteUser(any(), any());

        ResponseEntity<Void> res = controller.deleteUser(user, new UserWithdrawRequest("탈퇴 사유"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("이메일 변경 인증 발송 성공")
    void requestEmailChangeVerification_success() {
        willDoNothing().given(emailVerificationService).sendChangeEmailVerification(anyString(), anyString());

        ResponseEntity<?> res = controller.requestEmailChangeVerification(user, new EmailChangeRequest("new@email.com"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("이메일 변경 인증 확인 성공")
    void confirmEmailChange_success() {
        willDoNothing().given(emailVerificationService).verifyChangeEmail(anyString(), anyString(), anyString());

        ResponseEntity<?> res = controller.confirmEmailChange(user, new EmailChangeConfirmRequest("new@email.com", "123456"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("이메일 변경 확인 - 잘못된 코드 시 예외 전파")
    void confirmEmailChange_wrongCode() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(emailVerificationService).verifyChangeEmail(anyString(), anyString(), anyString());

        assertThatThrownBy(() -> controller.confirmEmailChange(user, new EmailChangeConfirmRequest("new@email.com", "999999")))
            .isInstanceOf(AppException.class);
    }
}
