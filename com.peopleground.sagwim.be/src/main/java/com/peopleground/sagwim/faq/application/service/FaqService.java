package com.peopleground.sagwim.faq.application.service;

import com.peopleground.sagwim.faq.domain.FaqErrorCode;
import com.peopleground.sagwim.faq.domain.entity.Faq;
import com.peopleground.sagwim.faq.domain.repository.FaqRepository;
import com.peopleground.sagwim.faq.presentation.dto.request.FaqCreateRequest;
import com.peopleground.sagwim.faq.presentation.dto.request.FaqUpdateRequest;
import com.peopleground.sagwim.faq.presentation.dto.response.AdminFaqResponse;
import com.peopleground.sagwim.faq.presentation.dto.response.FaqResponse;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FAQ(자주 묻는 질문) 서비스.
 *
 * <ul>
 *   <li>관리자: 목록 조회 + 등록/수정/노출 토글/삭제.</li>
 *   <li>클라이언트: 공개(published=true) 목록 조회.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FaqService {

    private final FaqRepository faqRepository;

    /**
     * 관리자 FAQ 목록 (정렬순서 오름차순, 노출/숨김 모두 포함).
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminFaqResponse> getFaqsForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(faqRepository.findAllForAdmin(pageable).map(AdminFaqResponse::from));
    }

    /**
     * 클라이언트 공개 FAQ 목록 (published=true, 정렬순서 오름차순).
     */
    @Transactional(readOnly = true)
    public List<FaqResponse> getPublishedFaqs() {
        return faqRepository.findPublished().stream()
            .map(FaqResponse::from)
            .toList();
    }

    public AdminFaqResponse create(FaqCreateRequest request) {
        Faq faq = Faq.of(
            request.question(),
            request.answer(),
            request.displayOrder() == null ? 0 : request.displayOrder(),
            request.published() == null || request.published()
        );
        return AdminFaqResponse.from(faqRepository.save(faq));
    }

    public AdminFaqResponse update(Long id, FaqUpdateRequest request) {
        Faq faq = findOrThrow(id);
        faq.update(
            request.question(),
            request.answer(),
            request.displayOrder() == null ? faq.getDisplayOrder() : request.displayOrder(),
            request.published() == null ? faq.isPublished() : request.published()
        );
        return AdminFaqResponse.from(faq);
    }

    public AdminFaqResponse togglePublished(Long id) {
        Faq faq = findOrThrow(id);
        faq.togglePublished();
        return AdminFaqResponse.from(faq);
    }

    public void delete(Long id) {
        Faq faq = findOrThrow(id);
        faqRepository.delete(faq);
    }

    private Faq findOrThrow(Long id) {
        return faqRepository.findById(id)
            .orElseThrow(() -> new AppException(FaqErrorCode.FAQ_NOT_FOUND));
    }
}
