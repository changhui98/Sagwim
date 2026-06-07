package com.peopleground.sagwim.group.presentation.controller;

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
import com.peopleground.sagwim.group.application.service.AdminGroupService;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import com.peopleground.sagwim.group.presentation.dto.request.AdminDeleteGroupRequest;
import com.peopleground.sagwim.group.presentation.dto.response.AdminGroupResponse;
import com.peopleground.sagwim.user.domain.entity.UserRole;
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
class AdminGroupControllerTest {

    @Mock AdminGroupService adminGroupService;
    @InjectMocks AdminGroupController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    private AdminGroupResponse mockResponse() {
        return new AdminGroupResponse(1L, "모임", "설명", GroupCategory.HOBBY,
            GroupMeetingType.ONLINE, null, 10, 1, "닉네임", "leader", GroupStatus.ACTIVE, null, null);
    }

    @Test
    @DisplayName("관리자 모임 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getAllGroups_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(adminGroupService.getAllGroups(0, 10, null, null)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getAllGroups(0, 10, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 승인 성공")
    void approveGroup_success() {
        given(adminGroupService.approveGroup(1L)).willReturn(mockResponse());

        ResponseEntity<AdminGroupResponse> res = controller.approveGroup(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 승인 - 없는 모임이면 예외 전파")
    void approveGroup_notFound() {
        given(adminGroupService.approveGroup(999L)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.approveGroup(999L))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("모임 거절 성공")
    void rejectGroup_success() {
        given(adminGroupService.rejectGroup(1L)).willReturn(mockResponse());

        ResponseEntity<AdminGroupResponse> res = controller.rejectGroup(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 삭제 성공 - 204 No Content")
    void deleteGroup_success() {
        willDoNothing().given(adminGroupService).deleteGroup(eq(1L), eq(adminUser), anyString());

        ResponseEntity<Void> res = controller.deleteGroup(1L, new AdminDeleteGroupRequest("위반"), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("모임 복원 성공")
    void restoreGroup_success() {
        given(adminGroupService.restoreGroup(1L, adminUser)).willReturn(mockResponse());

        ResponseEntity<AdminGroupResponse> res = controller.restoreGroup(1L, adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
