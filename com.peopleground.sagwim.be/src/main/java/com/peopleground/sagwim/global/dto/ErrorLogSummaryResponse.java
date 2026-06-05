package com.peopleground.sagwim.global.dto;

/**
 * 에러 로그 요약 — 조회 기간(from~to) 기준 status group별 건수.
 *
 * @param total    기간 내 전체 에러 로그 건수
 * @param count4xx 400~499 건수
 * @param count5xx 500~599 건수
 */
public record ErrorLogSummaryResponse(long total, long count4xx, long count5xx) {
}
