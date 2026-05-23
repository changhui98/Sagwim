package com.peopleground.sagwim.schedule.infrastructure.repository;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleJpaRepository extends JpaRepository<Schedule, Long> {

    @Query("SELECT s FROM p_schedule s LEFT JOIN FETCH s.createdByUser WHERE s.group.id = :groupId AND s.startAt >= :start AND s.startAt < :end AND s.deletedDate IS NULL")
    List<Schedule> findByGroupIdAndStartAtBetween(
        @Param("groupId") Long groupId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("SELECT s FROM p_schedule s WHERE s.id = :id AND s.deletedDate IS NULL")
    Optional<Schedule> findByIdAndNotDeleted(@Param("id") Long id);

    @Query("SELECT DISTINCT s.group.id FROM p_schedule s WHERE s.startAt >= :weekStart AND s.startAt < :weekEnd AND s.deletedDate IS NULL")
    List<Long> findDistinctGroupIdsByStartAtBetween(
        @Param("weekStart") LocalDateTime weekStart,
        @Param("weekEnd") LocalDateTime weekEnd
    );
}
