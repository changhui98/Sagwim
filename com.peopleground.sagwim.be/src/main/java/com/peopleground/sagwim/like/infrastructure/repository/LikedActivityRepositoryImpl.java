package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.LikedActivityRow;
import com.peopleground.sagwim.like.domain.repository.LikedActivityRepository;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class LikedActivityRepositoryImpl implements LikedActivityRepository {

    private final LikedActivityJpaRepository likedActivityJpaRepository;

    @Override
    public List<LikedActivityRow> findLikedActivities(UUID userId, int page, int size) {
        int limit = size + 1;
        int offset = page * size;
        return likedActivityJpaRepository.findLikedActivities(userId, limit, offset).stream()
            .map(row -> new LikedActivityRow(
                (String) row[0],
                ((Number) row[1]).longValue(),
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
