package com.peopleground.sagwim.global.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.log.LogFileService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class AdminLogControllerTest {

    @Mock LogFileService logFileService;
    @Mock ObjectMapper objectMapper;
    @InjectMocks AdminLogController controller;

    @Test
    @DisplayName("에러 로그 목록 조회 성공")
    void getErrorLogs_success() {
        given(logFileService.getErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all"), anyInt(), anyInt()))
            .willReturn(List.of());
        given(logFileService.countErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all")))
            .willReturn(0L);

        ResponseEntity<Map<String, Object>> res = controller.getErrorLogs(0, 50, null, null, "all");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsKey("content");
        assertThat(res.getBody()).containsKey("totalElements");
    }

    @Test
    @DisplayName("에러 로그 목록 조회 - 데이터 있을 때")
    void getErrorLogs_withData() {
        given(logFileService.getErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all"), anyInt(), anyInt()))
            .willReturn(List.of("{\"level\":\"ERROR\",\"msg\":\"test error\"}"));
        given(logFileService.countErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all")))
            .willReturn(1L);

        ResponseEntity<Map<String, Object>> res = controller.getErrorLogs(0, 50, null, null, "all");

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Long) res.getBody().get("totalElements")).isEqualTo(1L);
    }

    @Test
    @DisplayName("가입 로그 목록 조회 성공")
    void getRegistrationLogs_success() {
        given(logFileService.getRegistrationLogs(any(LocalDate.class), any(LocalDate.class), anyInt(), anyInt()))
            .willReturn(List.of());
        given(logFileService.countRegistrationLogs(any(LocalDate.class), any(LocalDate.class)))
            .willReturn(0L);

        ResponseEntity<Map<String, Object>> res = controller.getRegistrationLogs(0, 50, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsKey("content");
    }

    @Test
    @DisplayName("에러 로그 페이지네이션 계산 검증")
    void getErrorLogs_pagination() {
        given(logFileService.getErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all"), anyInt(), anyInt()))
            .willReturn(List.of());
        given(logFileService.countErrorLogs(any(LocalDate.class), any(LocalDate.class), eq("all")))
            .willReturn(100L);

        ResponseEntity<Map<String, Object>> res = controller.getErrorLogs(0, 50, null, null, "all");

        assertThat(res.getBody().get("totalPages")).isEqualTo(2);
        assertThat(res.getBody().get("hasNext")).isEqualTo(true);
    }
}
