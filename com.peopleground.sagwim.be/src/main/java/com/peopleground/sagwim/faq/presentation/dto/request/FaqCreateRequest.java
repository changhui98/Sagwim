package com.peopleground.sagwim.faq.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * FAQ 등록 요청 DTO.
 *
 * <p>displayOrder / published 는 선택 입력이며, 서비스 레이어에서 기본값(0 / true)을 적용한다.</p>
 */
public record FaqCreateRequest(
    @NotBlank(message = "질문을 입력해주세요.")
    @Size(max = 255, message = "질문은 255자 이하이어야 합니다.")
    String question,

    @NotBlank(message = "답변을 입력해주세요.")
    String answer,

    Integer displayOrder,

    Boolean published
) {}
