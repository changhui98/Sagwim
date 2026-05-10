package com.peopleground.sagwim.report.domain.repository;

import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportRepository {

    Report save(Report report);

    /**
     * 동일 유저가 동일 대상을 이미 신고했는지 확인한다.
     */
    boolean existsByReporterUserIdAndTargetTypeAndTargetId(
        UUID reporterUserId,
        ReportTargetType targetType,
        Long targetId
    );

    /**
     * 관리자 목록 조회: 신고 레코드 + 신고된 콘텐츠 본문 + 신고자 닉네임을
     * QueryDSL join + IN 배치 조회로 N+1 없이 반환한다.
     */
    Page<AdminReportResponse> findAllForAdmin(Pageable pageable);
}
