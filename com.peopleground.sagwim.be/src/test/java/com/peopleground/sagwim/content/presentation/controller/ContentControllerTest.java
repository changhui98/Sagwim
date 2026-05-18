package com.peopleground.sagwim.content.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.content.application.service.ContentService;
import com.peopleground.sagwim.content.presentation.dto.request.ContentCreateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.ContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
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
class ContentControllerTest {

    @Mock ContentService contentService;
    @InjectMocks ContentController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    private ContentResponse mockContent() {
        return new ContentResponse(1L, "내용", "testuser", "닉네임", null, 0, 0, false, List.of(), List.of());
    }

    @Test
    @DisplayName("게시글 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getContents_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(contentService.getContents(0, 10, null, SearchType.TITLE, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getContents(0, 10, null, SearchType.TITLE, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("모임 게시글 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getContentsByGroup_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(contentService.getContentsByGroupId(1L, 0, 10, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getContentsByGroup(1L, 0, 10, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("내 게시글 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getMyContents_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(contentService.getMyContents(user, 0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getMyContents(0, 10, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("게시글 단건 조회 성공")
    void getContent_success() {
        given(contentService.getContent(1L, user)).willReturn(mockContent());

        ResponseEntity<ContentResponse> res = controller.getContent(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("게시글 단건 조회 - 없는 게시글이면 예외 전파")
    void getContent_notFound() {
        given(contentService.getContent(999L, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getContent(999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("게시글 작성 성공 - 201 Created")
    void contentCreate_success() {
        ContentCreateRequest req = new ContentCreateRequest("내용", List.of("tag1"), null);
        given(contentService.contentCreate(req, user)).willReturn(mockContent());

        ResponseEntity<ContentResponse> res = controller.contentCreate(req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("게시글 수정 성공")
    void updateContent_success() {
        ContentUpdateRequest req = new ContentUpdateRequest("수정된 내용", List.of());
        given(contentService.updateContent(1L, req, user)).willReturn(mockContent());

        ResponseEntity<ContentResponse> res = controller.updateContent(1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("게시글 수정 - 권한 없으면 예외 전파")
    void updateContent_forbidden() {
        ContentUpdateRequest req = new ContentUpdateRequest("수정", List.of());
        given(contentService.updateContent(eq(1L), any(), eq(user)))
            .willThrow(new AppException(ApiErrorCode.FORBIDDEN));

        assertThatThrownBy(() -> controller.updateContent(1L, req, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("게시글 삭제 성공 - 204 No Content")
    void deleteContent_success() {
        willDoNothing().given(contentService).deleteContent(1L, user);

        ResponseEntity<Void> res = controller.deleteContent(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("게시글 삭제 - 없는 게시글이면 예외 전파")
    void deleteContent_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(contentService).deleteContent(999L, user);

        assertThatThrownBy(() -> controller.deleteContent(999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("username별 게시글 조회 성공")
    @SuppressWarnings("unchecked")
    void getContentsByUsername_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(contentService.getContentsByUsername(user, "testuser", 0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getContentsByUsername("testuser", 0, 10, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
