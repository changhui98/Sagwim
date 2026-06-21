package com.peopleground.sagwim.faq.presentation.controller;

import com.peopleground.sagwim.faq.application.service.FaqService;
import com.peopleground.sagwim.faq.presentation.dto.request.FaqCreateRequest;
import com.peopleground.sagwim.faq.presentation.dto.request.FaqUpdateRequest;
import com.peopleground.sagwim.faq.presentation.dto.response.AdminFaqResponse;
import com.peopleground.sagwim.global.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 FAQ CRUD API.
 * ADMIN 또는 MANAGER 권한이 필요하다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/faqs")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminFaqController {

    private final FaqService faqService;

    /**
     * FAQ 목록 조회 (페이징, 정렬순서 오름차순, 노출/숨김 모두 포함).
     *
     * <p>GET /api/v1/admin/faqs?page=0&size=20</p>
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminFaqResponse>> getFaqs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(faqService.getFaqsForAdmin(page, size));
    }

    /**
     * FAQ 등록.
     *
     * <p>POST /api/v1/admin/faqs</p>
     */
    @PostMapping
    public ResponseEntity<AdminFaqResponse> createFaq(@RequestBody @Valid FaqCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(faqService.create(request));
    }

    /**
     * FAQ 수정.
     *
     * <p>PATCH /api/v1/admin/faqs/{id}</p>
     */
    @PatchMapping("/{id}")
    public ResponseEntity<AdminFaqResponse> updateFaq(
        @PathVariable Long id,
        @RequestBody @Valid FaqUpdateRequest request
    ) {
        return ResponseEntity.ok(faqService.update(id, request));
    }

    /**
     * FAQ 노출 여부 토글 (게시 ↔ 숨김).
     *
     * <p>PATCH /api/v1/admin/faqs/{id}/published</p>
     */
    @PatchMapping("/{id}/published")
    public ResponseEntity<AdminFaqResponse> togglePublished(@PathVariable Long id) {
        return ResponseEntity.ok(faqService.togglePublished(id));
    }

    /**
     * FAQ 삭제 (하드 딜리트).
     *
     * <p>DELETE /api/v1/admin/faqs/{id}</p>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable Long id) {
        faqService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
