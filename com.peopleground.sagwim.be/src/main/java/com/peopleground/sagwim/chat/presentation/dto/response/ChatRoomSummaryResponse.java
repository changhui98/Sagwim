package com.peopleground.sagwim.chat.presentation.dto.response;

import java.time.LocalDateTime;

/**
 * 채팅방 목록 항목.
 * QueryDSL DTO projection으로 조립 — N+1 없이 단일 쿼리로 완성.
 */
public record ChatRoomSummaryResponse(
    Long roomId,
    String partnerUsername,
    String partnerNickname,
    String partnerProfileImageUrl,
    String lastMessageContent,
    LocalDateTime lastMessageAt,
    long unreadCount
) {}
