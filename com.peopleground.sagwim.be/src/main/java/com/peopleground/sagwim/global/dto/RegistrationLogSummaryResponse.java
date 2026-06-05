package com.peopleground.sagwim.global.dto;

import java.util.Map;

/**
 * 회원가입 로그 요약 — 조회 기간(from~to) 기준 provider별 건수.
 *
 * @param total      기간 내 전체 가입 건수
 * @param byProvider provider(로그에 기록된 원본 문자열) → 건수
 */
public record RegistrationLogSummaryResponse(long total, Map<String, Long> byProvider) {
}
