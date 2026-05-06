package com.peopleground.sagwim.deletelog.infrastructure.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import com.peopleground.sagwim.deletelog.domain.repository.DeleteLogRepository;
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
}
