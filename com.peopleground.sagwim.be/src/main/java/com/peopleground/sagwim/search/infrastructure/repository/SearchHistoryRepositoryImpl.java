package com.peopleground.sagwim.search.infrastructure.repository;

import com.peopleground.sagwim.search.domain.SearchHistoryRow;
import com.peopleground.sagwim.search.domain.entity.SearchTargetType;
import com.peopleground.sagwim.search.domain.repository.SearchHistoryRepository;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class SearchHistoryRepositoryImpl implements SearchHistoryRepository {

    private final SearchHistoryJpaRepository searchHistoryJpaRepository;

    @Override
    public void save(UUID userId, SearchTargetType type, String targetId) {
        searchHistoryJpaRepository.upsert(userId, type.name(), targetId);
    }

    @Override
    public List<SearchHistoryRow> findRecent(UUID userId, int limit) {
        return searchHistoryJpaRepository.findRecent(userId, limit).stream()
            .map(row -> new SearchHistoryRow(
                SearchTargetType.valueOf((String) row[0]),
                (String) row[1],
                toLocalDateTime(row[2])
            ))
            .toList();
    }

    /**
     * native query 의 timestamp 컬럼은 드라이버/Hibernate 설정에 따라
     * java.sql.Timestamp 또는 java.time.LocalDateTime 으로 매핑될 수 있어 둘 다 처리한다.
     */
    private static LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return (LocalDateTime) value;
    }
}
