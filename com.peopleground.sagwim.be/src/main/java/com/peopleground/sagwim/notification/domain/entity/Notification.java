package com.peopleground.sagwim.notification.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_notification")
@Table(
    name = "p_notification",
    indexes = {
        @Index(name = "idx_notification_recipient_created", columnList = "recipient_id, created_date DESC")
    }
)
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 알림 수신자. 알림은 수신자 기준 최신순 조회가 핵심 패턴이므로
     * recipient_id 컬럼에 인덱스를 둔다. 단방향 ManyToOne LAZY 로 User 풀 로딩을 지연시킨다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    /**
     * 행동 주체(좋아요/댓글/가입자)의 닉네임 스냅샷.
     * 알림 메시지는 닉네임 외 추가 정보를 거의 사용하지 않으므로,
     * actor User 를 FK 로 묶지 않고 비정규화하여 조회 시 조인 비용을 제거한다.
     */
    @Column(name = "actor_nickname", nullable = false)
    private String actorNickname;

    /**
     * 행동 주체의 프로필 이미지 URL 스냅샷. nullable.
     * 시간 경과 후 actor 가 프로필을 변경해도 알림 시점의 모습이 유지된다.
     */
    @Column(name = "actor_profile_image_url", length = 500)
    private String actorProfileImageUrl;

    /**
     * 알림이 가리키는 대상 ID (게시글 ID, 모임 ID 등). 도메인별로 다르므로 단순 Long 으로만 저장.
     */
    @Column(name = "target_id")
    private Long targetId;

    /**
     * 대상 제목/이름 스냅샷 (게시글 제목, 모임 이름 등). nullable.
     */
    @Column(name = "target_title")
    private String targetTitle;

    /**
     * 컬럼명을 'is_read' 로 매핑. 'read' 는 일부 DB 에서 예약어로 충돌할 수 있으므로 안전한 이름을 사용한다.
     */
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    public static Notification of(
        User recipient,
        NotificationType type,
        String actorNickname,
        String actorProfileImageUrl,
        Long targetId,
        String targetTitle
    ) {
        Notification notification = new Notification();
        notification.recipient = recipient;
        notification.type = type;
        notification.actorNickname = actorNickname;
        notification.actorProfileImageUrl = actorProfileImageUrl;
        notification.targetId = targetId;
        notification.targetTitle = targetTitle;
        notification.read = false;
        return notification;
    }

    public void markAsRead() {
        this.read = true;
    }
}
