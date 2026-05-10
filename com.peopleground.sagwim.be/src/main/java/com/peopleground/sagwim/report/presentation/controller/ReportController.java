package com.peopleground.sagwim.report.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.report.application.service.ReportService;
import com.peopleground.sagwim.report.presentation.dto.request.ReportCreateRequest;
import com.peopleground.sagwim.report.presentation.dto.response.ReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자 신고 API.
 * JWT 인증 필요.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService reportService;

    /**
     * 게시글 또는 댓글을 신고한다.
     *
     * <pre>
     * POST /api/v1/reports
     * {
     *   "targetType": "POST" | "COMMENT",
     *   "targetId":  123,
     *   "reason":    "신고 사유"
     * }
     * </pre>
     */
    @PostMapping
    public ResponseEntity<ReportResponse> createReport(
        @Valid @RequestBody ReportCreateRequest req,
        @AuthenticationPrincipal CustomUser user
    ) {
        ReportResponse response = reportService.createReport(req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
