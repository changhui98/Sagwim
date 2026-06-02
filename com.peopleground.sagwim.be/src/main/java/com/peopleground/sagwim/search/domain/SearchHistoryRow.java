package com.peopleground.sagwim.search.domain;

import com.peopleground.sagwim.search.domain.entity.SearchTargetType;
import java.time.LocalDateTime;

/**
 * 최근 검색 기록 한 행(라벨 채우기 전). targetId 는 USER 면 username, POST/GROUP 이면 id 문자열.
 */
public record SearchHistoryRow(SearchTargetType type, String targetId, LocalDateTime viewedAt) {
}
