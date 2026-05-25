package com.peopleground.sagwim.deletelog.infrastructure.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeleteLogJpaRepository extends JpaRepository<DeleteLog, Long> {

    Page<DeleteLog> findAllByOrderByDeletedAtDesc(Pageable pageable);

    Page<DeleteLog> findAllByDeletedAtBetweenOrderByDeletedAtDesc(
        LocalDateTime from, LocalDateTime to, Pageable pageable);

    @Query("SELECT dl FROM delete_log dl WHERE dl.targetType = :targetType AND dl.targetId = :targetId AND dl.restored = false ORDER BY dl.deletedAt DESC LIMIT 1")
    Optional<DeleteLog> findTopByTargetTypeAndTargetIdAndRestoredFalse(
        @Param("targetType") String targetType,
        @Param("targetId") String targetId
    );
}
