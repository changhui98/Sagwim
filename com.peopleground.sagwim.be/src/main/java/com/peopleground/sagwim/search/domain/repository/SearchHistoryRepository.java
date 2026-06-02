package com.peopleground.sagwim.search.domain.repository;

import com.peopleground.sagwim.search.domain.SearchHistoryRow;
import com.peopleground.sagwim.search.domain.entity.SearchTargetType;
import java.util.List;
import java.util.UUID;

/**
 * 최근 검색 기록 저장·조회 포트.
 */
public interface SearchHistoryRepository {

    /**
     * 검색 기록을 저장한다. 동일 (user, type, targetId) 가 이미 있으면 lastViewedAt 만 갱신한다.
     */
    void save(UUID userId, SearchTargetType type, String targetId);

    /**
     * 최근 본 순으로 검색 기록을 조회한다.
     */
    List<SearchHistoryRow> findRecent(UUID userId, int limit);
}
