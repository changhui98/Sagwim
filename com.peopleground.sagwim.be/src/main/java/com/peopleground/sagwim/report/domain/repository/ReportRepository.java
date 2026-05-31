package com.peopleground.sagwim.report.domain.repository;

import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import java.util.Collection;
import java.util.Set;
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
     * 한 유저가 주어진 targetId 중 이미 신고한 것만 Set 으로 반환한다.
     * 목록 응답에 reportedByMe 플래그를 IN 쿼리 한 번으로 매핑할 때 사용한다.
     */
    Set<Long> findReportedTargetIds(
        UUID reporterUserId,
        ReportTargetType targetType,
        Collection<Long> targetIds
    );

    /**
     * 관리자 목록 조회: 신고 레코드 + 신고된 콘텐츠 본문 + 신고자 닉네임을
     * QueryDSL join + IN 배치 조회로 N+1 없이 반환한다.
     */
    Page<AdminReportResponse> findAllForAdmin(Pageable pageable);
}
