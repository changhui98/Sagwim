package com.peopleground.sagwim.schedule.application.service;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.domain.entity.NotificationType;
import com.peopleground.sagwim.schedule.domain.ScheduleErrorCode;
import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import com.peopleground.sagwim.schedule.domain.entity.ScheduleAttendance;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleAttendanceRepository;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.AttendanceToggleResponse;
import com.peopleground.sagwim.schedule.presentation.dto.response.ScheduleResponse;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleAttendanceRepository scheduleAttendanceRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ScheduleResponse createSchedule(Long groupId, ScheduleCreateRequest request, CustomUser customUser) {
        Group group = findGroup(groupId);

        if (!groupMemberRepository.existsByGroupIdAndUsername(groupId, customUser.getUsername())) {
            throw new AppException(ScheduleErrorCode.SCHEDULE_NOT_MEMBER);
        }

        if (!request.endAt().isAfter(request.startAt())) {
            throw new AppException(ScheduleErrorCode.SCHEDULE_INVALID_DATE);
        }

        User createdByUser = getUser(customUser.getUsername());

        Schedule schedule = Schedule.of(
            group,
            createdByUser,
            request.title(),
            request.startAt(),
            request.endAt(),
            request.location(),
            request.description()
        );

        Schedule saved = scheduleRepository.save(schedule);

        // 모임 일정 등록 알림: 일정 등록자를 제외한 전체 모임원에게 발행한다.
        // 모임 인원이 그리 크지 않다는 가정 하에 단순 루프로 N건의 INSERT 를 처리한다.
        // 향후 인원이 매우 커지면 batch insert / 비동기 처리로 전환을 검토한다.
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        for (GroupMember member : members) {
            User recipient = member.getUser();
            if (recipient.getId().equals(createdByUser.getId())) {
                continue;
            }
            notificationService.notify(
                recipient,
                NotificationType.MEETING_SCHEDULE_ADDED,
                createdByUser,
                group.getId(),
                group.getName()
            );
        }

        // 방금 생성된 일정: 참석자 0명, 미참석
        return ScheduleResponse.from(saved, 0, false);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByMonth(Long groupId, int year, int month, CustomUser customUser) {
        findGroup(groupId);

        List<Schedule> schedules = scheduleRepository.findByGroupIdAndYearMonth(groupId, year, month);
        if (schedules.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> scheduleIds = schedules.stream().map(Schedule::getId).toList();

        // N+1 방지: 참석 수와 내 참석 여부를 배치 조회
        Map<Long, Integer> attendeeCountMap = scheduleAttendanceRepository.countByScheduleIds(scheduleIds);

        Set<Long> myAttendingIds;
        if (customUser != null) {
            myAttendingIds = scheduleAttendanceRepository.findAttendingScheduleIdsByUserIdAndScheduleIds(
                customUser.getId(), scheduleIds
            );
        } else {
            myAttendingIds = Set.of();
        }

        return schedules.stream()
            .map(schedule -> ScheduleResponse.from(
                schedule,
                attendeeCountMap.getOrDefault(schedule.getId(), 0),
                myAttendingIds.contains(schedule.getId())
            ))
            .toList();
    }

    @Transactional
    public AttendanceToggleResponse toggleAttendance(Long groupId, Long scheduleId, CustomUser customUser) {
        if (!groupMemberRepository.existsByGroupIdAndUsername(groupId, customUser.getUsername())) {
            throw new AppException(ScheduleErrorCode.SCHEDULE_NOT_MEMBER);
        }

        Schedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new AppException(ScheduleErrorCode.SCHEDULE_NOT_FOUND));

        UUID userId = customUser.getId();
        Optional<ScheduleAttendance> existing = scheduleAttendanceRepository.findByScheduleIdAndUserId(scheduleId, userId);

        boolean attending;
        if (existing.isPresent()) {
            scheduleAttendanceRepository.delete(existing.get());
            attending = false;
        } else {
            User user = getUser(customUser.getUsername());
            scheduleAttendanceRepository.save(ScheduleAttendance.of(schedule, user));
            attending = true;
        }

        int attendeeCount = scheduleAttendanceRepository.countByScheduleId(scheduleId);
        return new AttendanceToggleResponse(attending, attendeeCount);
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }
}
