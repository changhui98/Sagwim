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
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.ScheduleResponse;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
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

        return ScheduleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> getSchedulesByMonth(Long groupId, int year, int month) {
        findGroup(groupId);
        return scheduleRepository.findByGroupIdAndYearMonth(groupId, year, month)
            .stream()
            .map(ScheduleResponse::from)
            .toList();
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
