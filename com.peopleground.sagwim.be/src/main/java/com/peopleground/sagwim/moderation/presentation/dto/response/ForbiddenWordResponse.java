package com.peopleground.sagwim.moderation.presentation.dto.response;

import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWord;
import java.time.LocalDateTime;

/**
 * 금지 단어 응답 DTO.
 *
 * @param id                금지 단어 ID
 * @param word              정규화된 금지 단어
 * @param createdByNickname 등록자 닉네임. 시드/레거시 데이터인 경우 null
 * @param createdDate       등록일시
 * @param deletedDate       소프트 삭제일시. null 이면 활성 상태
 */
public record ForbiddenWordResponse(
    Long id,
    String word,
    String createdByNickname,
    LocalDateTime createdDate,
    LocalDateTime deletedDate
) {
    public static ForbiddenWordResponse of(ForbiddenWord entity, String createdByNickname) {
        return new ForbiddenWordResponse(
            entity.getId(),
            entity.getWord(),
            createdByNickname,
            entity.getCreatedDate(),
            entity.getDeletedDate()
        );
    }
}
