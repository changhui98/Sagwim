package com.peopleground.sagwim.faq.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * FAQ 수정 요청 DTO.
 */
public record FaqUpdateRequest(
    @NotBlank(message = "질문을 입력해주세요.")
    @Size(max = 255, message = "질문은 255자 이하이어야 합니다.")
    String question,

    @NotBlank(message = "답변을 입력해주세요.")
    String answer,

    Integer displayOrder,

    Boolean published
) {}
