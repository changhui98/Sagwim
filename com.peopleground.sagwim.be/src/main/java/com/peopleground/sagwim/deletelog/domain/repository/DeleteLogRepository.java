package com.peopleground.sagwim.deletelog.domain.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeleteLogRepository {

    DeleteLog save(DeleteLog deleteLog);

    Optional<DeleteLog> findById(Long id);

    Page<DeleteLog> findAllOrderByDeletedAtDesc(Pageable pageable);

    Page<DeleteLog> findAllByDeletedAtBetweenOrderByDeletedAtDesc(
        LocalDateTime from, LocalDateTime to, Pageable pageable);

    Optional<DeleteLog> findTopByTargetTypeAndTargetIdAndRestoredFalse(String targetType, String targetId);

    long countByDeletedAtBetween(LocalDateTime from, LocalDateTime to);

    long countRestoredByDeletedAtBetween(LocalDateTime from, LocalDateTime to);

    /** 대상 유형(targetType) → 건수 집계. 단일 GROUP BY 쿼리로 조회. */
    Map<String, Long> countGroupByTargetTypeBetween(LocalDateTime from, LocalDateTime to);
}
