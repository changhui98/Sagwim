package com.peopleground.sagwim.like.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.like.application.service.LikeService;
import com.peopleground.sagwim.like.presentation.dto.response.LikeStatusResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeToggleResponse;
import com.peopleground.sagwim.user.domain.entity.UserRole;
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
class CommentLikeControllerTest {

    @Mock LikeService likeService;
    @InjectMocks CommentLikeController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    @Test
    @DisplayName("댓글 좋아요 토글 성공 - liked=true")
    void toggleCommentLike_success() {
        given(likeService.toggleCommentLike(1L, user)).willReturn(LikeToggleResponse.liked(3));

        ResponseEntity<LikeToggleResponse> res = controller.toggleCommentLike(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().liked()).isTrue();
    }

    @Test
    @DisplayName("댓글 좋아요 토글 - 없는 댓글이면 예외 전파")
    void toggleCommentLike_notFound() {
        given(likeService.toggleCommentLike(999L, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.toggleCommentLike(999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 좋아요 상태 조회 성공 - 좋아요 한 경우")
    void getCommentLikeStatus_liked() {
        given(likeService.getCommentLikeStatus(1L, user)).willReturn(LikeStatusResponse.of(true));

        ResponseEntity<LikeStatusResponse> res = controller.getCommentLikeStatus(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().liked()).isTrue();
    }

    @Test
    @DisplayName("댓글 좋아요 상태 조회 - 좋아요 안 한 경우")
    void getCommentLikeStatus_notLiked() {
        given(likeService.getCommentLikeStatus(1L, user)).willReturn(LikeStatusResponse.of(false));

        ResponseEntity<LikeStatusResponse> res = controller.getCommentLikeStatus(1L, user);

        assertThat(res.getBody().liked()).isFalse();
    }
}
