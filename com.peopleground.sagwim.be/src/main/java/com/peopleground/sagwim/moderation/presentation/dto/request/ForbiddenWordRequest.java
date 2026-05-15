package com.peopleground.sagwim.moderation.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 금지 단어 등록/수정 요청 DTO.
 *
 * <p>word 는 서비스 레이어에서 {@code ProfanityValidator#normalize()} 를 통해 정규화된다.</p>
 */
public record ForbiddenWordRequest(
    @NotBlank(message = "금지 단어를 입력해주세요.")
    @Size(max = 100, message = "금지 단어는 100자 이하이어야 합니다.")
    String word
) {}
