package com.peopleground.sagwim.chat.domain.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoom;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository {

    ChatRoom save(ChatRoom room);

    Optional<ChatRoom> findById(Long id);

    /**
     * 두 사용자 간 1:1 채팅방 조회 (아직 탈퇴하지 않은 방).
     * userA/userB 순서 무관하게 하나의 방을 반환한다.
     */
    Optional<Long> findDirectRoomId(UUID userAId, UUID userBId);
}
