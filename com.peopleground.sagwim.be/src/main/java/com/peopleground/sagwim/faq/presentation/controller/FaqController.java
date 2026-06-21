package com.peopleground.sagwim.faq.presentation.controller;

import com.peopleground.sagwim.faq.application.service.FaqService;
import com.peopleground.sagwim.faq.presentation.dto.response.FaqResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 클라이언트 공개 FAQ API.
 * 비로그인 사용자도 접근 가능하다 (SecurityConfig 에서 permitAll).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/faqs")
public class FaqController {

    private final FaqService faqService;

    /**
     * 공개 FAQ 목록 조회 (published=true, 정렬순서 오름차순).
     *
     * <p>GET /api/v1/faqs</p>
     */
    @GetMapping
    public ResponseEntity<List<FaqResponse>> getFaqs() {
        return ResponseEntity.ok(faqService.getPublishedFaqs());
    }
}
