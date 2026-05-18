package com.peopleground.sagwim.schedule.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.schedule.application.service.ScheduleService;
import com.peopleground.sagwim.schedule.presentation.dto.request.ScheduleCreateRequest;
import com.peopleground.sagwim.schedule.presentation.dto.response.ScheduleResponse;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ScheduleControllerTest {

    @Mock ScheduleService scheduleService;
    @InjectMocks ScheduleController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    private ScheduleResponse mockSchedule() {
        return new ScheduleResponse(1L, "회의", LocalDateTime.now(), LocalDateTime.now().plusHours(1), null, null, "testuser", "닉네임");
    }

    @Test
    @DisplayName("일정 생성 성공 - 201 Created")
    void createSchedule_success() {
        ScheduleCreateRequest req = new ScheduleCreateRequest("회의", LocalDateTime.now(), LocalDateTime.now().plusHours(1), null, null);
        given(scheduleService.createSchedule(1L, req, user)).willReturn(mockSchedule());

        ResponseEntity<ScheduleResponse> res = controller.createSchedule(1L, req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("일정 생성 - 없는 모임이면 예외 전파")
    void createSchedule_groupNotFound() {
        ScheduleCreateRequest req = new ScheduleCreateRequest("회의", LocalDateTime.now(), LocalDateTime.now().plusHours(1), null, null);
        given(scheduleService.createSchedule(999L, req, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createSchedule(999L, req, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("월별 일정 조회 성공")
    void getSchedulesByMonth_success() {
        given(scheduleService.getSchedulesByMonth(1L, 2026, 5)).willReturn(List.of(mockSchedule()));

        ResponseEntity<List<ScheduleResponse>> res = controller.getSchedulesByMonth(1L, 2026, 5);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).hasSize(1);
    }

    @Test
    @DisplayName("월별 일정 조회 - 빈 목록 반환")
    void getSchedulesByMonth_empty() {
        given(scheduleService.getSchedulesByMonth(1L, 2026, 1)).willReturn(List.of());

        ResponseEntity<List<ScheduleResponse>> res = controller.getSchedulesByMonth(1L, 2026, 1);

        assertThat(res.getBody()).isEmpty();
    }
}
