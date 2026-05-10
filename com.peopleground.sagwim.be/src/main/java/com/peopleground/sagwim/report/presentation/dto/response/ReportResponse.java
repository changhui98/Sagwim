package com.peopleground.sagwim.report.presentation.dto.response;

import com.peopleground.sagwim.report.domain.entity.Report;
import java.time.LocalDateTime;

/**
 * 신고 생성 성공 응답 DTO.
 */
public record ReportResponse(
    Long id,
    String targetType,
    Long targetId,
    String status,
    LocalDateTime reportedAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
            report.getId(),
            report.getTargetType().name(),
            report.getTargetId(),
            report.getStatus().name(),
            report.getCreatedDate()
        );
    }
}
