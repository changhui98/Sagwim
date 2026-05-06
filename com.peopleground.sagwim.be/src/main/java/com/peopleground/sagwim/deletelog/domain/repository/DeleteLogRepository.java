package com.peopleground.sagwim.deletelog.domain.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DeleteLogRepository {

    DeleteLog save(DeleteLog deleteLog);

    Optional<DeleteLog> findById(Long id);

    Page<DeleteLog> findAllOrderByDeletedAtDesc(Pageable pageable);
}
