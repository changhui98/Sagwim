package com.peopleground.sagwim.faq.presentation.dto.response;

import com.peopleground.sagwim.faq.domain.entity.Faq;

/**
 * 클라이언트 공개 FAQ 응답 DTO. 노출용 최소 필드만 포함한다.
 */
public record FaqResponse(
    Long id,
    String question,
    String answer
) {
    public static FaqResponse from(Faq faq) {
        return new FaqResponse(faq.getId(), faq.getQuestion(), faq.getAnswer());
    }
}
