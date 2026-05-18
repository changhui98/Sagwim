package com.peopleground.sagwim.report.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.report.application.service.ReportService;
import com.peopleground.sagwim.report.domain.entity.ReportTargetType;
import com.peopleground.sagwim.report.presentation.dto.request.ReportCreateRequest;
import com.peopleground.sagwim.report.presentation.dto.response.ReportResponse;
import com.peopleground.sagwim.user.domain.entity.UserRole;
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
class ReportControllerTest {

    @Mock ReportService reportService;
    @InjectMocks ReportController controller;

    private CustomUser user;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
    }

    @Test
    @DisplayName("신고 생성 성공 - 201 Created")
    void createReport_success() {
        ReportCreateRequest req = new ReportCreateRequest(ReportTargetType.POST, 1L, "스팸입니다");
        ReportResponse mockRes = new ReportResponse(1L, "POST", 1L, "PENDING", null);
        given(reportService.createReport(req, user)).willReturn(mockRes);

        ResponseEntity<ReportResponse> res = controller.createReport(req, user);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).isNotNull();
    }

    @Test
    @DisplayName("신고 생성 - 자기 자신 신고 시 예외 전파")
    void createReport_selfReport() {
        ReportCreateRequest req = new ReportCreateRequest(ReportTargetType.POST, 1L, "테스트");
        given(reportService.createReport(req, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createReport(req, user))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("신고 생성 - 이미 신고한 경우 예외 전파")
    void createReport_alreadyReported() {
        ReportCreateRequest req = new ReportCreateRequest(ReportTargetType.COMMENT, 1L, "부적절");
        given(reportService.createReport(req, user)).willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createReport(req, user))
            .isInstanceOf(AppException.class);
    }
}
