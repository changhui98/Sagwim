package com.peopleground.sagwim.notification.application.service;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.notification.domain.NotificationErrorCode;
import com.peopleground.sagwim.notification.domain.entity.Notification;
import com.peopleground.sagwim.notification.domain.entity.NotificationType;
import com.peopleground.sagwim.notification.domain.repository.NotificationRepository;
import com.peopleground.sagwim.notification.presentation.dto.response.NotificationResponse;
import com.peopleground.sagwim.user.domain.entity.User;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 알림 도메인 서비스.
 *
 * <p><b>설계 노트</b></p>
 * <ul>
 *   <li>{@link #notify(User, NotificationType, User, Long, String)} 는 도메인 이벤트 트리거 측에서
 *       호출하는 핵심 진입점이다. 호출측 트랜잭션 안에서 함께 커밋되도록 {@code REQUIRED} 전파를 사용한다.</li>
 *   <li>actor 의 닉네임/프로필 이미지를 알림 행에 스냅샷으로 저장한다. 이후 actor 가 닉네임을
 *       바꿔도 과거 알림 메시지가 변형되지 않도록 비정규화한 설계다.</li>
 *   <li>actor 와 recipient 가 동일한 경우(자기 자신에게 좋아요/댓글) 호출측에서 차단한다.
 *       서비스는 이미 들어온 호출을 신뢰하고 그대로 저장한다.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ImageUrlResolver imageUrlResolver;

    /**
     * 알림 1건 발행. actor 의 닉네임/프로필 이미지를 스냅샷으로 캡처해 저장한다.
     */
    @Transactional
    public void notify(
        User recipient,
        NotificationType type,
        User actor,
        Long targetId,
        String targetTitle
    ) {
        Notification notification = Notification.of(
            recipient,
            type,
            actor.getNickname(),
            actor.getProfileImageUrl(),
            targetId,
            targetTitle
        );
        notificationRepository.save(notification);
    }

    /**
     * 내 알림 목록 (최신순 페이지네이션).
     */
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(CustomUser customUser, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByRecipientId(customUser.getId(), pageable);
        return PageResponse.from(notifications.map(n -> NotificationResponse.from(
            n, imageUrlResolver.resolve(n.getActorProfileImageUrl())
        )));
    }

    /**
     * 내 미읽음 알림 수.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(CustomUser customUser) {
        return notificationRepository.countUnreadByRecipientId(customUser.getId());
    }

    /**
     * 단일 알림 읽음 처리. 본인의 알림만 가능.
     */
    @Transactional
    public void markAsRead(Long notificationId, CustomUser customUser) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new AppException(NotificationErrorCode.NOTIFICATION_NOT_FOUND));

        if (notification.isDeleted()) {
            throw new AppException(NotificationErrorCode.NOTIFICATION_NOT_FOUND);
        }

        UUID recipientId = notification.getRecipient().getId();
        if (!recipientId.equals(customUser.getId())) {
            throw new AppException(NotificationErrorCode.NOTIFICATION_FORBIDDEN);
        }

        // 이미 읽은 알림은 멱등 처리 — UPDATE 호출 없이 빠르게 종료
        if (notification.isRead()) {
            return;
        }

        notification.markAsRead();
    }

    /**
     * 내 모든 미읽음 알림 일괄 읽음 처리.
     * 행 단위 LAZY 로딩 없이 단일 UPDATE 로 처리해 N+1 을 회피한다.
     *
     * @return 읽음 처리된 알림 수
     */
    @Transactional
    public int markAllAsRead(CustomUser customUser) {
        return notificationRepository.markAllAsReadByRecipientId(customUser.getId());
    }
}
