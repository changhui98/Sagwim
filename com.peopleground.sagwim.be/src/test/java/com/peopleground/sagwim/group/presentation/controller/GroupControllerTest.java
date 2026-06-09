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
import com.peopleground.sagwim.group.application.service.GroupService;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupJoinType;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import com.peopleground.sagwim.group.domain.entity.GroupStatus;
import com.peopleground.sagwim.group.presentation.dto.request.GroupCreateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupJoinQuestionsUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupJoinRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.response.GroupDetailResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.util.List;
import java.util.Map;
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
class GroupControllerTest {

    @Mock GroupService groupService;
    @InjectMocks GroupController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    private GroupResponse mockGroupResponse() {
        return new GroupResponse(1L, "테스트 모임", "설명", GroupCategory.HOBBY, List.of(),
            GroupMeetingType.ONLINE, null, 10, 1, "닉네임", "testuser", null, null, 0, GroupStatus.ACTIVE, false);
    }

    @Test
    @DisplayName("모임 생성 성공 - 201 Created")
    void createGroup_success() {
        GroupCreateRequest req = new GroupCreateRequest("테스트 모임", "설명", GroupCategory.HOBBY, List.of(), GroupMeetingType.ONLINE, 10, GroupJoinType.OPEN);
        given(groupService.createGroup(req, user)).willReturn(mockGroupResponse());

        ResponseEntity<GroupResponse> res = controller.createGroup(req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("모임 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getGroups_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(groupService.getGroups(0, 10, null, null, null, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getGroups(0, 10, null, null, null, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("신규 모임 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getNewGroups_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(groupService.getNewGroups(0, 20, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getNewGroups(0, 20, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("인기 모임 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getPopularGroups_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(groupService.getPopularGroups(0, 20, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getPopularGroups(0, 20, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 단건 조회 성공")
    void getGroup_success() {
        GroupDetailResponse detail = org.mockito.Mockito.mock(GroupDetailResponse.class);
        given(groupService.getGroup(1L)).willReturn(detail);

        ResponseEntity<GroupDetailResponse> res = controller.getGroup(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 단건 조회 - 없는 모임이면 예외 전파")
    void getGroup_notFound() {
        given(groupService.getGroup(999L)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getGroup(999L))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("모임 수정 성공")
    void updateGroup_success() {
        GroupUpdateRequest req = new GroupUpdateRequest("수정 모임", "설명", GroupCategory.HOBBY, List.of(), GroupMeetingType.ONLINE, null, 10, GroupJoinType.OPEN);
        given(groupService.updateGroup(1L, req, user)).willReturn(mockGroupResponse());

        ResponseEntity<GroupResponse> res = controller.updateGroup(1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 삭제 성공 - 204 No Content")
    void deleteGroup_success() {
        willDoNothing().given(groupService).deleteGroup(1L, user);

        ResponseEntity<Void> res = controller.deleteGroup(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("모임 삭제 - 권한 없으면 예외 전파")
    void deleteGroup_forbidden() {
        willThrow(new AppException(ApiErrorCode.FORBIDDEN)).given(groupService).deleteGroup(1L, user);

        assertThatThrownBy(() -> controller.deleteGroup(1L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("가입 질문 조회 성공")
    void getJoinQuestions_success() {
        given(groupService.getJoinQuestions(1L)).willReturn(List.of("질문1", "질문2"));

        ResponseEntity<List<String>> res = controller.getJoinQuestions(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(2);
    }

    @Test
    @DisplayName("가입 질문 수정 성공")
    void updateJoinQuestions_success() {
        willDoNothing().given(groupService).updateJoinQuestions(eq(1L), any(), eq(user));
        GroupJoinQuestionsUpdateRequest req = new GroupJoinQuestionsUpdateRequest(List.of("새 질문"));

        ResponseEntity<Void> res = controller.updateJoinQuestions(1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 가입 성공")
    void joinGroup_success() {
        willDoNothing().given(groupService).joinGroup(eq(1L), any(), eq(user));

        ResponseEntity<Void> res = controller.joinGroup(1L, new GroupJoinRequest("답변"), user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 탈퇴 성공 - 204 No Content")
    void leaveGroup_success() {
        willDoNothing().given(groupService).leaveGroup(1L, user);

        ResponseEntity<Void> res = controller.leaveGroup(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("내 모임 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getMyGroups_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(groupService.getMyGroups(user, 0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getMyGroups(user, 0, 10);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("내 가입 신청 상태 조회 성공")
    void getMyJoinRequestStatus_success() {
        given(groupService.hasMyPendingJoinRequest(1L, user)).willReturn(true);

        ResponseEntity<Map<String, Boolean>> res = controller.getMyJoinRequestStatus(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("pending", true);
    }

    @Test
    @DisplayName("가입 신청 취소 성공")
    void cancelMyJoinRequest_success() {
        willDoNothing().given(groupService).cancelMyJoinRequest(1L, user);

        ResponseEntity<Void> res = controller.cancelMyJoinRequest(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("가입 신청 승인 성공")
    void approveJoinRequest_success() {
        willDoNothing().given(groupService).approveJoinRequest(1L, 1L, user);

        ResponseEntity<Void> res = controller.approveJoinRequest(1L, 1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("가입 신청 거절 성공")
    void rejectJoinRequest_success() {
        willDoNothing().given(groupService).rejectJoinRequest(1L, 1L, user);

        ResponseEntity<Void> res = controller.rejectJoinRequest(1L, 1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("멤버 강제 탈퇴 성공 - 204 No Content")
    void kickMember_success() {
        willDoNothing().given(groupService).kickMember(1L, "member1", user);

        ResponseEntity<Void> res = controller.kickMember(1L, "member1", user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }
}
