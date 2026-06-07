package com.peopleground.sagwim.report.presentation.controller;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.report.application.service.ReportService;
import com.peopleground.sagwim.report.presentation.dto.response.AdminReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 신고 내역 API.
 * ADMIN 또는 MANAGER 권한 필요.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminReportController {

    private final ReportService reportService;

    /**
     * 신고 목록 조회 (페이지네이션, 최신순).
     *
     * <p>GET /api/v1/admin/reports?page=0&size=20</p>
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminReportResponse>> getReports(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(reportService.getReportsForAdmin(page, size, keyword));
    }
}
