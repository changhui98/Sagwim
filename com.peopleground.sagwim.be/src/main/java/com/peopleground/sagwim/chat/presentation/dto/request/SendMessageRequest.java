package com.peopleground.sagwim.chat.presentation.dto.request;

import com.peopleground.sagwim.chat.domain.entity.ChatMessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SendMessageRequest(
    @NotNull Long roomId,
    @NotBlank String content,
    ChatMessageType type
) {
    public ChatMessageType resolvedType() {
        return type != null ? type : ChatMessageType.TEXT;
    }
}
