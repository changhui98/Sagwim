package com.peopleground.sagwim.content.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.content.application.service.AdminContentService;
import com.peopleground.sagwim.content.presentation.dto.request.AdminContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.AdminDeleteContentRequest;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.content.presentation.dto.response.AdminContentResponse;
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
class AdminContentControllerTest {

    @Mock AdminContentService adminContentService;
    @InjectMocks AdminContentController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    private AdminContentResponse mockResponse() {
        return new AdminContentResponse(1L, "내용", UUID.randomUUID(), "testuser", null, null, null, null, null);
    }

    @Test
    @DisplayName("관리자 게시글 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getAllContents_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(adminContentService.getAllContents(0, 10, null, SearchType.TITLE)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getAllContents(0, 10, null, SearchType.TITLE);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 게시글 단건 조회 성공")
    void getContent_success() {
        given(adminContentService.getContent(1L)).willReturn(mockResponse());

        ResponseEntity<AdminContentResponse> res = controller.getContent(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 게시글 단건 조회 - 없으면 예외 전파")
    void getContent_notFound() {
        given(adminContentService.getContent(999L)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.getContent(999L))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("관리자 게시글 수정 성공")
    void updateContent_success() {
        AdminContentUpdateRequest req = new AdminContentUpdateRequest("수정된 내용");
        given(adminContentService.updateContent(1L, req)).willReturn(mockResponse());

        ResponseEntity<AdminContentResponse> res = controller.updateContent(1L, req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 게시글 삭제 성공 - 204 No Content")
    void deleteContent_success() {
        willDoNothing().given(adminContentService).deleteContent(eq(1L), eq(adminUser), anyString());

        ResponseEntity<Void> res = controller.deleteContent(1L, new AdminDeleteContentRequest("위반"), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("관리자 게시글 복원 성공")
    void restoreContent_success() {
        given(adminContentService.restoreContent(eq(1L), anyString())).willReturn(mockResponse());

        ResponseEntity<AdminContentResponse> res = controller.restoreContent(1L, adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
