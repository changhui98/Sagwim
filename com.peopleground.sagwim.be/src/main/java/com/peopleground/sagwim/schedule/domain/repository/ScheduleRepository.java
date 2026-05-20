package com.peopleground.sagwim.schedule.domain.repository;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import java.util.List;
import java.util.Optional;

public interface ScheduleRepository {

    Schedule save(Schedule schedule);

    Optional<Schedule> findById(Long id);

    List<Schedule> findByGroupIdAndYearMonth(Long groupId, int year, int month);
}
