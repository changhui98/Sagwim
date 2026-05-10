package com.peopleground.sagwim.report.infrastructure.repository;

import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportJpaRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterUserIdAndTargetTypeAndTargetId(
        UUID reporterUserId,
        ReportTargetType targetType,
        Long targetId
    );

    Page<Report> findAllByOrderByCreatedDateDesc(Pageable pageable);
}
