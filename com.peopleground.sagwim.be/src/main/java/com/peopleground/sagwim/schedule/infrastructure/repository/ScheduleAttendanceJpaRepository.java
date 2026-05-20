package com.peopleground.sagwim.schedule.infrastructure.repository;

import com.peopleground.sagwim.schedule.domain.entity.ScheduleAttendance;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleAttendanceJpaRepository extends JpaRepository<ScheduleAttendance, Long> {

    Optional<ScheduleAttendance> findByScheduleIdAndUserId(Long scheduleId, UUID userId);

    int countByScheduleId(Long scheduleId);

    /**
     * 복수 scheduleId 를 한 번에 집계해 N+1 을 방지한다.
     * 반환: [scheduleId, count] 쌍의 배열 목록
     */
    @Query("SELECT sa.schedule.id, COUNT(sa) FROM p_schedule_attendance sa WHERE sa.schedule.id IN :scheduleIds GROUP BY sa.schedule.id")
    List<Object[]> countGroupByScheduleIds(@Param("scheduleIds") List<Long> scheduleIds);

    /**
     * 특정 사용자가 참석 중인 scheduleId 집합을 한 번에 조회한다.
     */
    @Query("SELECT sa.schedule.id FROM p_schedule_attendance sa WHERE sa.user.id = :userId AND sa.schedule.id IN :scheduleIds")
    Set<Long> findAttendingScheduleIds(@Param("userId") UUID userId, @Param("scheduleIds") List<Long> scheduleIds);
}
