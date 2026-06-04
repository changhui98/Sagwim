package com.peopleground.sagwim.schedule.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import com.peopleground.sagwim.schedule.domain.entity.ScheduleAttendance;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleAttendanceRepository;
import com.peopleground.sagwim.schedule.domain.repository.ScheduleRepository;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.AttendanceToggleResponse;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleService 단위 테스트")
class ScheduleServiceTest {

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleAttendanceRepository scheduleAttendanceRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private ScheduleService scheduleService;

    private static final String USERNAME = "me";

    private CustomUser customUser(UUID id) {
        return new CustomUser(id, USERNAME, null, null, true);
    }

    @Test
    @DisplayName("일정 생성 - 모임 멤버가 아니면 예외를 던진다")
    void createSchedule_notMember_throws() {
        // given
        Group group = org.mockito.Mockito.mock(Group.class);
        given(groupRepository.findById(1L)).willReturn(Optional.of(group));
        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(false);

        ScheduleCreateRequest request = org.mockito.Mockito.mock(ScheduleCreateRequest.class);

        // when & then
        assertThatThrownBy(() -> scheduleService.createSchedule(1L, request, customUser(UUID.randomUUID())))
            .isInstanceOf(AppException.class);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("일정 생성 - 종료 시각이 시작 시각보다 빠르거나 같으면 예외를 던진다")
    void createSchedule_invalidDate_throws() {
        // given
        Group group = org.mockito.Mockito.mock(Group.class);
        given(groupRepository.findById(1L)).willReturn(Optional.of(group));
        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(true);

        LocalDateTime start = LocalDateTime.of(2026, 6, 10, 18, 0);
        ScheduleCreateRequest request = org.mockito.Mockito.mock(ScheduleCreateRequest.class);
        given(request.startAt()).willReturn(start);
        given(request.endAt()).willReturn(start); // endAt == startAt → 무효

        // when & then
        assertThatThrownBy(() -> scheduleService.createSchedule(1L, request, customUser(UUID.randomUUID())))
            .isInstanceOf(AppException.class);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("참석 토글 - 모임 멤버가 아니면 예외를 던진다")
    void toggleAttendance_notMember_throws() {
        // given
        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(false);

        // when & then
        assertThatThrownBy(() -> scheduleService.toggleAttendance(1L, 100L, customUser(UUID.randomUUID())))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("참석 토글 - 미참석 상태면 참석으로 전환하고 저장한다")
    void toggleAttendance_add() {
        // given
        UUID meId = UUID.randomUUID();
        Schedule schedule = org.mockito.Mockito.mock(Schedule.class);
        User me = org.mockito.Mockito.mock(User.class);

        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(true);
        given(scheduleRepository.findById(100L)).willReturn(Optional.of(schedule));
        given(scheduleAttendanceRepository.findByScheduleIdAndUserId(100L, meId)).willReturn(Optional.empty());
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(scheduleAttendanceRepository.countByScheduleId(100L)).willReturn(3);

        // when
        AttendanceToggleResponse response = scheduleService.toggleAttendance(1L, 100L, customUser(meId));

        // then
        assertThat(response.attending()).isTrue();
        assertThat(response.attendeeCount()).isEqualTo(3);
        verify(scheduleAttendanceRepository).save(any(ScheduleAttendance.class));
        verify(scheduleAttendanceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("참석 토글 - 이미 참석 상태면 취소하고 삭제한다")
    void toggleAttendance_cancel() {
        // given
        UUID meId = UUID.randomUUID();
        Schedule schedule = org.mockito.Mockito.mock(Schedule.class);
        ScheduleAttendance existing = org.mockito.Mockito.mock(ScheduleAttendance.class);

        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(true);
        given(scheduleRepository.findById(100L)).willReturn(Optional.of(schedule));
        given(scheduleAttendanceRepository.findByScheduleIdAndUserId(100L, meId)).willReturn(Optional.of(existing));
        given(scheduleAttendanceRepository.countByScheduleId(100L)).willReturn(2);

        // when
        AttendanceToggleResponse response = scheduleService.toggleAttendance(1L, 100L, customUser(meId));

        // then
        assertThat(response.attending()).isFalse();
        assertThat(response.attendeeCount()).isEqualTo(2);
        verify(scheduleAttendanceRepository).delete(existing);
        verify(scheduleAttendanceRepository, never()).save(any());
    }

    @Test
    @DisplayName("참석 토글 - 일정이 존재하지 않으면 예외를 던진다")
    void toggleAttendance_scheduleNotFound_throws() {
        // given
        given(groupMemberRepository.existsByGroupIdAndUsername(1L, USERNAME)).willReturn(true);
        given(scheduleRepository.findById(100L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> scheduleService.toggleAttendance(1L, 100L, customUser(UUID.randomUUID())))
            .isInstanceOf(AppException.class);
    }
}
