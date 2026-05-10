package com.peopleground.sagwim.report.presentation.dto.request;

import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 신고 생성 요청 DTO.
 *
 * <pre>
 * POST /api/v1/reports
 * {
 *   "targetType": "POST" | "COMMENT",
 *   "targetId":  123,
 *   "reason":    "신고 사유 (1~500자)"
 * }
 * </pre>
 */
public record ReportCreateRequest(

    @NotNull(message = "신고 대상 유형을 입력해주세요.")
    ReportTargetType targetType,

    @NotNull(message = "신고 대상 ID를 입력해주세요.")
    Long targetId,

    @NotBlank(message = "신고 사유를 입력해주세요.")
    @Size(min = 1, max = 500, message = "신고 사유는 1자 이상 500자 이하로 입력해주세요.")
    String reason
) {
}
