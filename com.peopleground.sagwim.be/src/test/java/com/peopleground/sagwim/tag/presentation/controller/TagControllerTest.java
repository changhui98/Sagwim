package com.peopleground.sagwim.tag.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.content.application.service.ContentService;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.tag.application.service.TagService;
import com.peopleground.sagwim.tag.presentation.dto.response.TagResponse;
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
class TagControllerTest {

    @Mock TagService tagService;
    @Mock ContentService contentService;
    @InjectMocks TagController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    @Test
    @DisplayName("인기 태그 목록 조회 성공")
    void getPopularTags_success() {
        List<TagResponse> tags = List.of(new TagResponse(1L, "spring", 50), new TagResponse(2L, "java", 30));
        given(tagService.getPopularTags()).willReturn(tags);

        ResponseEntity<List<TagResponse>> res = controller.getPopularTags();

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(2);
    }

    @Test
    @DisplayName("인기 태그 목록 조회 - 빈 목록 반환")
    void getPopularTags_empty() {
        given(tagService.getPopularTags()).willReturn(List.of());

        ResponseEntity<List<TagResponse>> res = controller.getPopularTags();

        assertThat(res.getBody()).isEmpty();
    }

    @Test
    @DisplayName("태그 자동완성 검색 성공")
    void searchTags_success() {
        List<TagResponse> tags = List.of(new TagResponse(1L, "spring", 50));
        given(tagService.searchTags("spr")).willReturn(tags);

        ResponseEntity<List<TagResponse>> res = controller.searchTags("spr");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("태그로 게시글 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getContentsByTagName_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(contentService.getContentsByTagName("spring", 0, 10, user)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getContentsByTagName("spring", 0, 10, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("태그로 게시글 목록 조회 - 없는 태그 시 예외 전파")
    void getContentsByTagName_notFound() {
        given(contentService.getContentsByTagName("없는태그", 0, 10, user))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getContentsByTagName("없는태그", 0, 10, user))
            .isInstanceOf(AppException.class);
    }
}
