package com.peopleground.sagwim.schedule.infrastructure.repository;

import com.peopleground.sagwim.schedule.domain.entity.ScheduleAttendance;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleAttendanceRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ScheduleAttendanceRepositoryImpl implements ScheduleAttendanceRepository {

    private final ScheduleAttendanceJpaRepository scheduleAttendanceJpaRepository;

    @Override
    public Optional<ScheduleAttendance> findByScheduleIdAndUserId(Long scheduleId, UUID userId) {
        return scheduleAttendanceJpaRepository.findByScheduleIdAndUserId(scheduleId, userId);
    }

    @Override
    public int countByScheduleId(Long scheduleId) {
        return scheduleAttendanceJpaRepository.countByScheduleId(scheduleId);
    }

    @Override
    public void delete(ScheduleAttendance attendance) {
        scheduleAttendanceJpaRepository.delete(attendance);
    }

    @Override
    public ScheduleAttendance save(ScheduleAttendance attendance) {
        return scheduleAttendanceJpaRepository.save(attendance);
    }

    @Override
    public Map<Long, Integer> countByScheduleIds(List<Long> scheduleIds) {
        if (scheduleIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = scheduleAttendanceJpaRepository.countGroupByScheduleIds(scheduleIds);
        Map<Long, Integer> result = new HashMap<>();
        for (Object[] row : rows) {
            Long scheduleId = (Long) row[0];
            int count = ((Long) row[1]).intValue();
            result.put(scheduleId, count);
        }
        return result;
    }

    @Override
    public Set<Long> findAttendingScheduleIdsByUserIdAndScheduleIds(UUID userId, List<Long> scheduleIds) {
        if (scheduleIds.isEmpty()) {
            return Set.of();
        }
        return scheduleAttendanceJpaRepository.findAttendingScheduleIds(userId, scheduleIds);
    }
}
