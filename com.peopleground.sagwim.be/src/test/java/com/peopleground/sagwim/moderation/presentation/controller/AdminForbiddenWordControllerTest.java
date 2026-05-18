package com.peopleground.sagwim.moderation.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.moderation.application.ForbiddenWordAdminService;
import com.peopleground.sagwim.moderation.presentation.dto.request.ForbiddenWordRequest;
import com.peopleground.sagwim.moderation.presentation.dto.response.ForbiddenWordResponse;
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
class AdminForbiddenWordControllerTest {

    @Mock ForbiddenWordAdminService forbiddenWordAdminService;
    @InjectMocks AdminForbiddenWordController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    private ForbiddenWordResponse mockResponse() {
        return new ForbiddenWordResponse(1L, "욕설", "admin닉", null, null);
    }

    @Test
    @DisplayName("금지 단어 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getForbiddenWords_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(forbiddenWordAdminService.getForbiddenWords(0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getForbiddenWords(0, 10);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("금지 단어 등록 성공 - 201 Created")
    void createForbiddenWord_success() {
        given(forbiddenWordAdminService.createForbiddenWord("욕설", "admin")).willReturn(mockResponse());

        ResponseEntity<ForbiddenWordResponse> res = controller.createForbiddenWord(new ForbiddenWordRequest("욕설"), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("금지 단어 등록 - 이미 존재하면 예외 전파")
    void createForbiddenWord_duplicate() {
        given(forbiddenWordAdminService.createForbiddenWord("욕설", "admin"))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createForbiddenWord(new ForbiddenWordRequest("욕설"), adminUser))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("금지 단어 수정 성공")
    void updateForbiddenWord_success() {
        given(forbiddenWordAdminService.updateForbiddenWord(1L, "수정어")).willReturn(mockResponse());

        ResponseEntity<ForbiddenWordResponse> res = controller.updateForbiddenWord(1L, new ForbiddenWordRequest("수정어"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("금지 단어 수정 - 없는 단어 시 예외 전파")
    void updateForbiddenWord_notFound() {
        given(forbiddenWordAdminService.updateForbiddenWord(999L, "수정어"))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.updateForbiddenWord(999L, new ForbiddenWordRequest("수정어")))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("금지 단어 삭제 성공 - 204 No Content")
    void deleteForbiddenWord_success() {
        willDoNothing().given(forbiddenWordAdminService).deleteForbiddenWord(1L);

        ResponseEntity<Void> res = controller.deleteForbiddenWord(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("금지 단어 삭제 - 없는 단어 시 예외 전파")
    void deleteForbiddenWord_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(forbiddenWordAdminService).deleteForbiddenWord(999L);

        assertThatThrownBy(() -> controller.deleteForbiddenWord(999L))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("금지 단어 복원 성공")
    void restoreForbiddenWord_success() {
        given(forbiddenWordAdminService.restoreForbiddenWord(1L)).willReturn(mockResponse());

        ResponseEntity<ForbiddenWordResponse> res = controller.restoreForbiddenWord(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
