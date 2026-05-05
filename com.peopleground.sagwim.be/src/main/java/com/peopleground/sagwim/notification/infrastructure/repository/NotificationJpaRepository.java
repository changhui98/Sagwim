package com.peopleground.sagwim.notification.infrastructure.repository;

import com.peopleground.sagwim.notification.domain.entity.Notification;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationJpaRepository extends JpaRepository<Notification, Long> {

    /**
     * 수신자 기준 활성 알림(소프트삭제 제외) 최신순 페이지네이션.
     * recipient_id + deleted_date 부분 인덱스를 활용한다 (V6 마이그레이션).
     */
    @Query(
        value = """
            SELECT n FROM p_notification n
             WHERE n.recipient.id = :recipientId
               AND n.deletedDate IS NULL
             ORDER BY n.createdDate DESC
            """,
        countQuery = """
            SELECT COUNT(n) FROM p_notification n
             WHERE n.recipient.id = :recipientId
               AND n.deletedDate IS NULL
            """
    )
    Page<Notification> findActiveByRecipientId(
        @Param("recipientId") UUID recipientId,
        Pageable pageable
    );

    /**
     * 수신자의 미읽음 알림 수.
     * 부분 인덱스(idx_notification_recipient_unread)를 활용해 인덱스 스캔만으로 카운트한다.
     */
    @Query("""
        SELECT COUNT(n) FROM p_notification n
         WHERE n.recipient.id = :recipientId
           AND n.read = false
           AND n.deletedDate IS NULL
        """)
    long countUnreadByRecipientId(@Param("recipientId") UUID recipientId);

    /**
     * 수신자의 모든 미읽음 알림을 단일 UPDATE 로 읽음 처리.
     * @Modifying clearAutomatically=true 로 1차 캐시와의 sync 손실을 방지한다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE p_notification n
           SET n.read = true,
               n.lastModifiedDate = CURRENT_TIMESTAMP
         WHERE n.recipient.id = :recipientId
           AND n.read = false
           AND n.deletedDate IS NULL
        """)
    int markAllAsReadByRecipientId(@Param("recipientId") UUID recipientId);
}
