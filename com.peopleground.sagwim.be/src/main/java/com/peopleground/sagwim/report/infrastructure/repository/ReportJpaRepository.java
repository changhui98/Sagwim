package com.peopleground.sagwim.report.infrastructure.repository;

import com.peopleground.sagwim.report.domain.entity.Report;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportJpaRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterUserIdAndTargetTypeAndTargetId(
        UUID reporterUserId,
        ReportTargetType targetType,
        Long targetId
    );

    Page<Report> findAllByOrderByCreatedDateDesc(Pageable pageable);

    /**
     * 한 유저가 주어진 targetId 목록 중 이미 신고한 항목만 IN 쿼리 한 번으로 가져온다.
     * 게시글/댓글 목록의 reportedByMe 매핑에 사용된다.
     */
    @Query("SELECT r.targetId FROM Report r "
        + "WHERE r.reporterUserId = :reporterUserId "
        + "AND r.targetType = :targetType "
        + "AND r.targetId IN :targetIds")
    List<Long> findReportedTargetIds(
        @Param("reporterUserId") UUID reporterUserId,
        @Param("targetType") ReportTargetType targetType,
        @Param("targetIds") Collection<Long> targetIds
    );
}
