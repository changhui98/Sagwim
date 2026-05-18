package com.peopleground.sagwim.comment.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.comment.application.service.CommentService;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentCreateRequest;
import com.peopleground.sagwim.comment.presentation.dto.request.CommentUpdateRequest;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentListResponse;
import com.peopleground.sagwim.comment.presentation.dto.response.CommentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
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
class CommentControllerTest {

    @Mock CommentService commentService;
    @InjectMocks CommentController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    private CommentResponse mockComment() {
        return new CommentResponse(1L, "testuser", "닉네임", null, "댓글 내용", 0, false, false, false, null, null, null, List.of());
    }

    @Test
    @DisplayName("댓글 목록 조회 성공")
    void getComments_success() {
        CommentListResponse mockList = new CommentListResponse(List.of(), null, false);
        given(commentService.getComments(eq(1L), any(), eq(20), any())).willReturn(mockList);

        ResponseEntity<CommentListResponse> res = controller.getComments(1L, null, 20, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("댓글 목록 조회 - 비로그인 상태(null user)도 허용")
    void getComments_notLoggedIn() {
        CommentListResponse mockList = new CommentListResponse(List.of(), null, false);
        given(commentService.getComments(eq(1L), any(), eq(20), any())).willReturn(mockList);

        ResponseEntity<CommentListResponse> res = controller.getComments(1L, null, 20, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("댓글 작성 성공 - 201 Created")
    void createComment_success() {
        CommentCreateRequest req = new CommentCreateRequest("댓글 내용", null);
        given(commentService.createComment(1L, req, user)).willReturn(mockComment());

        ResponseEntity<CommentResponse> res = controller.createComment(1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("댓글 작성 - 없는 게시글이면 예외 전파")
    void createComment_contentNotFound() {
        CommentCreateRequest req = new CommentCreateRequest("댓글", null);
        given(commentService.createComment(eq(999L), eq(req), eq(user)))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createComment(999L, req, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 수정 성공")
    void updateComment_success() {
        CommentUpdateRequest req = new CommentUpdateRequest("수정된 댓글");
        given(commentService.updateComment(1L, 1L, req, user)).willReturn(mockComment());

        ResponseEntity<CommentResponse> res = controller.updateComment(1L, 1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("댓글 수정 - 권한 없으면 예외 전파")
    void updateComment_forbidden() {
        CommentUpdateRequest req = new CommentUpdateRequest("수정");
        given(commentService.updateComment(eq(1L), eq(1L), eq(req), eq(user)))
            .willThrow(new AppException(ApiErrorCode.FORBIDDEN));

        assertThatThrownBy(() -> controller.updateComment(1L, 1L, req, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 삭제 성공 - 204 No Content")
    void deleteComment_success() {
        willDoNothing().given(commentService).deleteComment(1L, 1L, user);

        ResponseEntity<Void> res = controller.deleteComment(1L, 1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("댓글 삭제 - 없는 댓글이면 예외 전파")
    void deleteComment_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(commentService).deleteComment(1L, 999L, user);

        assertThatThrownBy(() -> controller.deleteComment(1L, 999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("대댓글 작성 성공 - 201 Created")
    void createReply_success() {
        CommentCreateRequest req = new CommentCreateRequest("대댓글", null);
        given(commentService.createReply(1L, 1L, req, user)).willReturn(mockComment());

        ResponseEntity<CommentResponse> res = controller.createReply(1L, 1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("대댓글 작성 - 없는 댓글이면 예외 전파")
    void createReply_parentNotFound() {
        CommentCreateRequest req = new CommentCreateRequest("대댓글", null);
        given(commentService.createReply(eq(1L), eq(999L), eq(req), eq(user)))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createReply(1L, 999L, req, user))
            .isInstanceOf(AppException.class);
    }
}
