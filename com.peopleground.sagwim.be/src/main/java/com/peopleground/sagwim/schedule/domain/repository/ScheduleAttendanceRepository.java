package com.peopleground.sagwim.schedule.domain.repository;

import com.peopleground.sagwim.schedule.domain.entity.ScheduleAttendance;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ScheduleAttendanceRepository {

    Optional<ScheduleAttendance> findByScheduleIdAndUserId(Long scheduleId, UUID userId);

    int countByScheduleId(Long scheduleId);

    void delete(ScheduleAttendance attendance);

    ScheduleAttendance save(ScheduleAttendance attendance);

    /** 복수 scheduleId 를 한 번에 조회해 N+1 을 방지한다. */
    Map<Long, Integer> countByScheduleIds(List<Long> scheduleIds);

    /** 특정 사용자가 참석 중인 scheduleId 집합을 한 번에 조회한다. */
    Set<Long> findAttendingScheduleIdsByUserIdAndScheduleIds(UUID userId, List<Long> scheduleIds);
}
