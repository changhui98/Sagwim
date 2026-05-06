package com.peopleground.sagwim.notification.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.application.service.NotificationSseEmitterService;
import com.peopleground.sagwim.notification.presentation.dto.response.NotificationResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Validated
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSseEmitterService sseEmitterService;

    /**
     * 내 알림 목록 (최신순, 페이지네이션).
     */
    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> getMyNotifications(
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
        @AuthenticationPrincipal CustomUser user
    ) {
        return ResponseEntity.ok(notificationService.getMyNotifications(user, page, size));
    }

    /**
     * SSE 스트림 연결. 연결 수립 시 현재 미읽음 수를 즉시 전송하고,
     * 이후 새 알림 발행 또는 읽음 처리 시마다 push 한다.
     * EventSource 는 커스텀 헤더를 지원하지 않으므로 ?token=Bearer%20xxx 쿼리 파라미터로 인증한다.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal CustomUser user) {
        long initialCount = notificationService.getUnreadCount(user);
        return sseEmitterService.connect(user.getId(), initialCount);
    }

    /**
     * 미읽음 알림 수. SSE 미지원 환경의 폴백 폴링용으로 유지한다.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
        @AuthenticationPrincipal CustomUser user
    ) {
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * 단일 알림 읽음 처리.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUser user
    ) {
        notificationService.markAsRead(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * 내 알림 전체 읽음 처리.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
        @AuthenticationPrincipal CustomUser user
    ) {
        int updated = notificationService.markAllAsRead(user);
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
