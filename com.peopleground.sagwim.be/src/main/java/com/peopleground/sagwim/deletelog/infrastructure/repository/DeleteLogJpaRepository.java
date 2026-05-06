package com.peopleground.sagwim.deletelog.infrastructure.repository;

import com.peopleground.sagwim.deletelog.domain.entity.DeleteLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeleteLogJpaRepository extends JpaRepository<DeleteLog, Long> {

    Page<DeleteLog> findAllByOrderByDeletedAtDesc(Pageable pageable);
}
