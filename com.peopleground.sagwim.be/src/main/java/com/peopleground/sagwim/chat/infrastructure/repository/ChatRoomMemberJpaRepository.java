package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoomMember;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRoomMemberJpaRepository extends JpaRepository<ChatRoomMember, Long> {

    @Query("""
        SELECT m FROM chat_room_member m
        WHERE m.room.id = :roomId AND m.user.id = :userId AND m.deletedDate IS NULL
        """)
    Optional<ChatRoomMember> findActiveByRoomAndUser(@Param("roomId") Long roomId, @Param("userId") UUID userId);
}
