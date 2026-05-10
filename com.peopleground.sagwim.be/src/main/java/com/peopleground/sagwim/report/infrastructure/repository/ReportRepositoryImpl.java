package com.peopleground.sagwim.report.infrastructure.repository;

import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.domain.repository.ReportRepository;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ReportRepositoryImpl implements ReportRepository {

    private final ReportJpaRepository reportJpaRepository;
    private final ReportQueryRepository reportQueryRepository;

    @Override
    public Report save(Report report) {
        return reportJpaRepository.save(report);
    }

    @Override
    public boolean existsByReporterUserIdAndTargetTypeAndTargetId(
        UUID reporterUserId,
        ReportTargetType targetType,
        Long targetId
    ) {
        return reportJpaRepository.existsByReporterUserIdAndTargetTypeAndTargetId(
            reporterUserId, targetType, targetId
        );
    }

    @Override
    public Page<AdminReportResponse> findAllForAdmin(Pageable pageable) {
        return reportQueryRepository.findAllForAdmin(pageable);
    }
}
