package com.peopleground.sagwim.inquiry.presentation.controller;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.inquiry.application.service.InquiryService;
import com.peopleground.sagwim.inquiry.presentation.dto.response.AdminInquiryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 문의/탈퇴 사유 내역 API.
 * ADMIN 또는 MANAGER 권한 필요.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/inquiries")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminInquiryController {

    private final InquiryService inquiryService;

    /**
     * 문의 목록 조회 (페이지네이션, 최신순).
     *
     * <p>GET /api/v1/admin/inquiries?page=0&size=20</p>
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminInquiryResponse>> getInquiries(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(inquiryService.getInquiriesForAdmin(page, size));
    }
}
