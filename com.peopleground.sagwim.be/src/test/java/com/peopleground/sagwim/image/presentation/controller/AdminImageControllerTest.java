package com.peopleground.sagwim.image.presentation.controller;

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
import com.peopleground.sagwim.image.application.service.ImageAdminService;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.presentation.dto.request.AdminDeleteImageRequest;
import com.peopleground.sagwim.image.presentation.dto.response.AdminImageResponse;
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
class AdminImageControllerTest {

    @Mock ImageAdminService imageAdminService;
    @InjectMocks AdminImageController controller;

    private CustomUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new CustomUser(UUID.randomUUID(), "admin", "pass", UserRole.ADMIN, true);
    }

    private AdminImageResponse mockResponse() {
        return new AdminImageResponse(1L, "code1", "file.jpg", "/images/file.jpg",
            ImageTargetType.CONTENT, "1", "게시글", "uploader", 1024L, "image/jpeg", null);
    }

    @Test
    @DisplayName("관리자 이미지 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getAllImages_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 10, 0L, 0, false);
        given(imageAdminService.getAllImagesForAdmin(0, 10)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getAllImages(0, 10);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 이미지 삭제 성공 - 204 No Content")
    void deleteImage_success() {
        willDoNothing().given(imageAdminService).deleteImageForAdmin(eq(1L), anyString(), anyString());

        ResponseEntity<Void> res = controller.deleteImage(1L, new AdminDeleteImageRequest("위반"), adminUser);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("관리자 이미지 삭제 - 없는 이미지이면 예외 전파")
    void deleteImage_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(imageAdminService).deleteImageForAdmin(eq(999L), anyString(), anyString());

        assertThatThrownBy(() -> controller.deleteImage(999L, new AdminDeleteImageRequest("위반"), adminUser))
            .isInstanceOf(AppException.class);
    }
}
