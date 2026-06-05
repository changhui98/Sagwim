package com.peopleground.sagwim.deletelog.infrastructure.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import com.peopleground.sagwim.deletelog.domain.repository.DeleteLogRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DeleteLogRepositoryImpl implements DeleteLogRepository {

    private final DeleteLogJpaRepository deleteLogJpaRepository;

    @Override
    public DeleteLog save(DeleteLog deleteLog) {
        return deleteLogJpaRepository.save(deleteLog);
    }

    @Override
    public Optional<DeleteLog> findById(Long id) {
        return deleteLogJpaRepository.findById(id);
    }

    @Override
    public Page<DeleteLog> findAllOrderByDeletedAtDesc(Pageable pageable) {
        return deleteLogJpaRepository.findAllByOrderByDeletedAtDesc(pageable);
    }

    @Override
    public Page<DeleteLog> findAllByDeletedAtBetweenOrderByDeletedAtDesc(
        LocalDateTime from, LocalDateTime to, Pageable pageable) {
        return deleteLogJpaRepository.findAllByDeletedAtBetweenOrderByDeletedAtDesc(from, to, pageable);
    }

    @Override
    public Optional<DeleteLog> findTopByTargetTypeAndTargetIdAndRestoredFalse(String targetType, String targetId) {
        return deleteLogJpaRepository.findTopByTargetTypeAndTargetIdAndRestoredFalse(targetType, targetId);
    }

    @Override
    public long countByDeletedAtBetween(LocalDateTime from, LocalDateTime to) {
        return deleteLogJpaRepository.countByDeletedAtBetween(from, to);
    }

    @Override
    public long countRestoredByDeletedAtBetween(LocalDateTime from, LocalDateTime to) {
        return deleteLogJpaRepository.countByRestoredTrueAndDeletedAtBetween(from, to);
    }

    @Override
    public Map<String, Long> countGroupByTargetTypeBetween(LocalDateTime from, LocalDateTime to) {
        List<Object[]> rows = deleteLogJpaRepository.countGroupByTargetTypeBetween(from, to);
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String targetType = (String) row[0];
            long count = ((Number) row[1]).longValue();
            result.put(targetType, count);
        }
        return result;
    }
}
