package com.peopleground.sagwim.notification.domain.repository;

import com.peopleground.sagwim.notification.domain.entity.Notification;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 알림 저장소 포트(인터페이스). 인프라 레이어에서 JPA/QueryDSL 어댑터로 구현한다.
 */
public interface NotificationRepository {

    Notification save(Notification notification);

    Optional<Notification> findById(Long id);

    /**
     * 수신자 기준 최신순 페이지네이션 조회. 소프트 삭제 제외.
     */
    Page<Notification> findByRecipientId(UUID recipientId, Pageable pageable);

    /**
     * 수신자 기준 미읽음 알림 수.
     */
    long countUnreadByRecipientId(UUID recipientId);

    /**
     * 수신자의 모든 미읽음 알림을 단일 UPDATE 로 읽음 처리한다.
     * 행 단위 LAZY 로딩 없이 DB 레벨 일괄 처리.
     *
     * @return 영향받은 행 수
     */
    int markAllAsReadByRecipientId(UUID recipientId);
}
