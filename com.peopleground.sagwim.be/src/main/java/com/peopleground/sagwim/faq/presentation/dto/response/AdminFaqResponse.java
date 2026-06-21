package com.peopleground.sagwim.faq.presentation.dto.response;

import com.peopleground.sagwim.faq.domain.entity.Faq;
import java.time.LocalDateTime;

/**
 * 관리자 FAQ 목록/상세 응답 DTO. 노출 여부와 정렬순서를 포함한다.
 */
public record AdminFaqResponse(
    Long id,
    String question,
    String answer,
    int displayOrder,
    boolean published,
    LocalDateTime createdDate
) {
    public static AdminFaqResponse from(Faq faq) {
        return new AdminFaqResponse(
            faq.getId(),
            faq.getQuestion(),
            faq.getAnswer(),
            faq.getDisplayOrder(),
            faq.isPublished(),
            faq.getCreatedDate()
        );
    }
}
