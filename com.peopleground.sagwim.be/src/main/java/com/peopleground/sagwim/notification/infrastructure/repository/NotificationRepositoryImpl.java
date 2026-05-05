package com.peopleground.sagwim.notification.infrastructure.repository;

import com.peopleground.sagwim.notification.domain.entity.Notification;
import com.peopleground.sagwim.notification.domain.repository.NotificationRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationRepository {

    private final NotificationJpaRepository notificationJpaRepository;

    @Override
    public Notification save(Notification notification) {
        return notificationJpaRepository.save(notification);
    }

    @Override
    public Optional<Notification> findById(Long id) {
        return notificationJpaRepository.findById(id);
    }

    @Override
    public Page<Notification> findByRecipientId(UUID recipientId, Pageable pageable) {
        return notificationJpaRepository.findActiveByRecipientId(recipientId, pageable);
    }

    @Override
    public long countUnreadByRecipientId(UUID recipientId) {
        return notificationJpaRepository.countUnreadByRecipientId(recipientId);
    }

    @Override
    public int markAllAsReadByRecipientId(UUID recipientId) {
        return notificationJpaRepository.markAllAsReadByRecipientId(recipientId);
    }
}
