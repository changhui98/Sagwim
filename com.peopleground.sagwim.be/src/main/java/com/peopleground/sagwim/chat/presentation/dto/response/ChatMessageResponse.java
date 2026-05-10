package com.peopleground.sagwim.chat.presentation.dto.response;

import com.peopleground.sagwim.chat.domain.entity.ChatMessage;
import com.peopleground.sagwim.chat.domain.entity.ChatMessageType;
import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    Long roomId,
    String senderUsername,
    String senderNickname,
    String senderProfileImageUrl,
    String content,
    ChatMessageType type,
    LocalDateTime createdDate
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getRoom().getId(),
            message.getSender().getUsername(),
            message.getSender().getNickname(),
            message.getSender().getProfileImageUrl(),
            message.getContent(),
            message.getType(),
            message.getCreatedDate()
        );
    }
}
