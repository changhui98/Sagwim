package com.peopleground.sagwim.deletelog.presentation.dto.response;

import java.util.Map;

/**
 * 삭제 로그 요약 — 조회 기간(from~to) 기준 집계.
 *
 * @param total        기간 내 전체 삭제 건수
 * @param byTargetType 대상 유형(USER/GROUP/POST/IMAGE) → 건수
 * @param restored     복원 처리된 건수
 * @param pending      미복원 건수
 */
public record DeleteLogSummaryResponse(
    long total,
    Map<String, Long> byTargetType,
    long restored,
    long pending
) {
}
