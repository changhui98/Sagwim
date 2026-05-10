package com.peopleground.sagwim.chat.domain.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoomMember;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomSummaryResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomMemberRepository {

    ChatRoomMember save(ChatRoomMember member);

    Optional<ChatRoomMember> findActiveByRoomAndUser(Long roomId, UUID userId);

    /**
     * 내 채팅방 목록 — N+1 차단: 단일 QueryDSL 쿼리로 상대방 정보 + 마지막 메시지 + 안읽은 수까지 한번에 조회.
     */
    List<ChatRoomSummaryResponse> findRoomSummaries(UUID userId, Long cursor, int size);
}
