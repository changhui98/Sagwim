package com.peopleground.sagwim.image.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.image.application.service.ImageService;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.presentation.dto.response.ImageResponse;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class ImageControllerTest {

    @Mock ImageService imageService;
    @InjectMocks ImageController controller;

    private ImageResponse mockResponse() {
        return new ImageResponse(1L, ImageTargetType.CONTENT, "1", "file.jpg", "/images/file.jpg", 1024L, "image/jpeg", 0, null);
    }

    @Test
    @DisplayName("이미지 업로드 성공 - 201 Created")
    void uploadImage_success() {
        MultipartFile file = Mockito.mock(MultipartFile.class);
        given(imageService.uploadImage(file, ImageTargetType.CONTENT, "1")).willReturn(mockResponse());

        ResponseEntity<ImageResponse> res = controller.uploadImage(file, ImageTargetType.CONTENT, "1");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("이미지 업로드 - 지원하지 않는 파일 형식이면 예외 전파")
    void uploadImage_unsupportedType() {
        MultipartFile file = Mockito.mock(MultipartFile.class);
        given(imageService.uploadImage(any(), any(), anyString()))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.uploadImage(file, ImageTargetType.CONTENT, "1"))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("이미지 목록 조회 성공")
    void getImages_success() {
        given(imageService.getImages(ImageTargetType.CONTENT, "1")).willReturn(List.of(mockResponse()));

        ResponseEntity<List<ImageResponse>> res = controller.getImages(ImageTargetType.CONTENT, "1");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("이미지 목록 조회 - 빈 목록 반환")
    void getImages_empty() {
        given(imageService.getImages(ImageTargetType.CONTENT, "999")).willReturn(List.of());

        ResponseEntity<List<ImageResponse>> res = controller.getImages(ImageTargetType.CONTENT, "999");

        assertThat(res.getBody()).isEmpty();
    }

    @Test
    @DisplayName("이미지 삭제 성공 - 204 No Content")
    void deleteImage_success() {
        willDoNothing().given(imageService).deleteImage(1L);

        ResponseEntity<Void> res = controller.deleteImage(1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("이미지 삭제 - 없는 이미지이면 예외 전파")
    void deleteImage_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST)).given(imageService).deleteImage(999L);

        assertThatThrownBy(() -> controller.deleteImage(999L))
            .isInstanceOf(AppException.class);
    }
}
