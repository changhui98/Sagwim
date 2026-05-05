package com.peopleground.sagwim.notification.presentation.dto.response;

import com.peopleground.sagwim.notification.domain.entity.Notification;
import com.peopleground.sagwim.notification.domain.entity.NotificationType;
import java.time.LocalDateTime;

/**
 * 알림 단건 응답 DTO. 프론트엔드에서 메시지 템플릿을 조립하기 위한 최소 필드를 노출한다.
 *
 * @param id                     알림 ID
 * @param type                   알림 타입 (FE 가 메시지 분기에 사용)
 * @param actorNickname          행동 주체 닉네임 (예: 좋아요 누른 사용자)
 * @param actorProfileImageUrl   행동 주체 프로필 이미지 (이미 ImageUrlResolver 로 해석된 절대/상대 URL)
 * @param targetId               이동 대상 식별자 (게시글 ID, 모임 ID 등)
 * @param targetTitle            이동 대상 제목/이름 스냅샷
 * @param read                   읽음 여부
 * @param createdDate            알림 생성 시각
 */
public record NotificationResponse(
    Long id,
    NotificationType type,
    String actorNickname,
    String actorProfileImageUrl,
    Long targetId,
    String targetTitle,
    boolean read,
    LocalDateTime createdDate
) {

    public static NotificationResponse from(Notification notification, String resolvedActorProfileImageUrl) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            notification.getActorNickname(),
            resolvedActorProfileImageUrl,
            notification.getTargetId(),
            notification.getTargetTitle(),
            notification.isRead(),
            notification.getCreatedDate()
        );
    }
}
