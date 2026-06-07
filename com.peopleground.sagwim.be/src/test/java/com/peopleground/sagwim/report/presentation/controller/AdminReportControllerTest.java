package com.peopleground.sagwim.report.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.report.application.service.ReportService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    @Mock ReportService reportService;
    @InjectMocks AdminReportController controller;

    @Test
    @DisplayName("관리자 신고 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getReports_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(reportService.getReportsForAdmin(0, 20, null, null)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getReports(0, 20, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("관리자 신고 목록 조회 - 다른 페이지 크기")
    @SuppressWarnings("unchecked")
    void getReports_differentPageSize() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 1, 10, 5L, 1, false);
        given(reportService.getReportsForAdmin(1, 10, null, null)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getReports(1, 10, null, null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
