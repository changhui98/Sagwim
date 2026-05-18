package com.peopleground.sagwim.like.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.like.application.service.LikeService;
import com.peopleground.sagwim.like.presentation.dto.response.GroupLikerResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeStatusResponse;
import com.peopleground.sagwim.like.presentation.dto.response.LikeToggleResponse;
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
class GroupLikeControllerTest {

    @Mock LikeService likeService;
    @InjectMocks GroupLikeController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    @Test
    @DisplayName("모임 좋아요 토글 성공 - liked=true")
    void toggleGroupLike_success() {
        given(likeService.toggleGroupLike(1L, user)).willReturn(LikeToggleResponse.liked(10));

        ResponseEntity<LikeToggleResponse> res = controller.toggleGroupLike(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().liked()).isTrue();
    }

    @Test
    @DisplayName("모임 좋아요 토글 - 없는 모임이면 예외 전파")
    void toggleGroupLike_notFound() {
        given(likeService.toggleGroupLike(999L, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.toggleGroupLike(999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("모임 좋아요 상태 조회 성공")
    void getGroupLikeStatus_success() {
        given(likeService.getGroupLikeStatus(1L, user)).willReturn(LikeStatusResponse.of(true));

        ResponseEntity<LikeStatusResponse> res = controller.getGroupLikeStatus(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().liked()).isTrue();
    }

    @Test
    @DisplayName("모임 좋아요 상태 조회 - 좋아요 안 한 경우")
    void getGroupLikeStatus_notLiked() {
        given(likeService.getGroupLikeStatus(1L, user)).willReturn(LikeStatusResponse.of(false));

        ResponseEntity<LikeStatusResponse> res = controller.getGroupLikeStatus(1L, user);

        assertThat(res.getBody().liked()).isFalse();
    }

    @Test
    @DisplayName("모임 좋아요한 사용자 목록 조회 성공")
    void getGroupLikers_success() {
        List<GroupLikerResponse> likers = List.of(new GroupLikerResponse("user1", "닉네임1", null));
        given(likeService.getGroupLikers(1L)).willReturn(likers);

        ResponseEntity<List<GroupLikerResponse>> res = controller.getGroupLikers(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }
}
