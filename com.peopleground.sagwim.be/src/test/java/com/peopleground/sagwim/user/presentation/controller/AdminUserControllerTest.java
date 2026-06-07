package com.peopleground.sagwim.user.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.application.AdminUserService;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import com.peopleground.sagwim.user.presentation.dto.request.AdminDeleteUserRequest;
import com.peopleground.sagwim.user.presentation.dto.request.ChangeUserRoleRequest;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserDetailResponse;
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
class AdminUserControllerTest {

    @Mock AdminUserService adminUserService;
    @InjectMocks AdminUserController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    @Test
    @DisplayName("관리자 사용자 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getUsersForAdmin_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(adminUserService.getUsersForAdmin(0, 10, null, null)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getUsersForAdmin(0, 10, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 사용자 상세 조회 성공")
    void getUserForAdmin_success() {
        AdminUserDetailResponse detail = new AdminUserDetailResponse(
            UUID.randomUUID(), "testuser", "닉네임", "a@b.com", UserRole.USER, null, null, null, null, false, null
        );
        given(adminUserService.getUserForAdmin("testuser")).willReturn(detail);

        ResponseEntity<AdminUserDetailResponse> res = controller.getUserForAdmin("testuser");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("관리자 사용자 상세 조회 - 없는 유저 예외 전파")
    void getUserForAdmin_notFound() {
        given(adminUserService.getUserForAdmin("noone")).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getUserForAdmin("noone"))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("관리자 사용자 삭제 성공 - 204 No Content")
    void deleteUserForAdmin_success() {
        willDoNothing().given(adminUserService).deleteUserForAdmin(anyString(), anyString(), anyString());

        ResponseEntity<Void> res = controller.deleteUserForAdmin("testuser",
            new AdminDeleteUserRequest("위반"), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("관리자 사용자 삭제 - 서비스 예외 전파")
    void deleteUserForAdmin_serviceThrows() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(adminUserService).deleteUserForAdmin(anyString(), anyString(), anyString());

        assertThatThrownBy(() -> controller.deleteUserForAdmin("testuser",
            new AdminDeleteUserRequest("위반"), adminUser))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("관리자 사용자 복원 성공")
    void restoreUserForAdmin_success() {
        AdminUserDetailResponse detail = new AdminUserDetailResponse(
            UUID.randomUUID(), "testuser", "닉네임", "a@b.com", UserRole.USER, null, null, null, null, false, null
        );
        given(adminUserService.restoreUserForAdmin(anyString(), eq("testuser"))).willReturn(detail);

        ResponseEntity<AdminUserDetailResponse> res = controller.restoreUserForAdmin("testuser", adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 사용자 역할 변경 성공 - 204 No Content")
    void changeUserRole_success() {
        willDoNothing().given(adminUserService).changeUserRole(anyString(), anyString(), eq(UserRole.MANAGER));

        ResponseEntity<Void> res = controller.changeUserRole("testuser",
            new ChangeUserRoleRequest(UserRole.MANAGER), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
