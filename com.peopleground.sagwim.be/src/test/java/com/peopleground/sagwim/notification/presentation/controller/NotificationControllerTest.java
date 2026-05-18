package com.peopleground.sagwim.notification.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.application.service.NotificationSseEmitterService;
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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock NotificationService notificationService;
    @Mock NotificationSseEmitterService sseEmitterService;
    @InjectMocks NotificationController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    @Test
    @DisplayName("내 알림 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getMyNotifications_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(notificationService.getMyNotifications(user, 0, 20)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getMyNotifications(0, 20, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("SSE 스트림 연결 성공")
    void stream_success() {
        SseEmitter emitter = new SseEmitter();
        given(notificationService.getUnreadCount(user)).willReturn(3L);
        given(sseEmitterService.connect(user.getId(), 3L)).willReturn(emitter);

        SseEmitter result = controller.stream(user);

        assertThat(result).isEqualTo(emitter);
    }

    @Test
    @DisplayName("미읽음 알림 수 조회 성공")
    void getUnreadCount_success() {
        given(notificationService.getUnreadCount(user)).willReturn(5L);

        ResponseEntity<Map<String, Long>> res = controller.getUnreadCount(user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("count", 5L);
    }

    @Test
    @DisplayName("단일 알림 읽음 처리 성공 - 204 No Content")
    void markAsRead_success() {
        willDoNothing().given(notificationService).markAsRead(1L, user);

        ResponseEntity<Void> res = controller.markAsRead(1L, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("단일 알림 읽음 처리 - 없는 알림이면 예외 전파")
    void markAsRead_notFound() {
        willThrow(new AppException(ApiErrorCode.INVALID_REQUEST))
            .given(notificationService).markAsRead(999L, user);

        assertThatThrownBy(() -> controller.markAsRead(999L, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("전체 알림 읽음 처리 성공")
    void markAllAsRead_success() {
        given(notificationService.markAllAsRead(user)).willReturn(3);

        ResponseEntity<Map<String, Integer>> res = controller.markAllAsRead(user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("updated", 3);
    }
}
