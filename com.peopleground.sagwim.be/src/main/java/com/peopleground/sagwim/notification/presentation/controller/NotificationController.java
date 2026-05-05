package com.peopleground.sagwim.notification.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.presentation.dto.response.NotificationResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Validated
public class NotificationController {

    private final NotificationService notificationService;

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
     * 미읽음 알림 수. 사이드바 배지에서 폴링 호출하므로 가벼운 인덱스 카운트만 수행한다.
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
