package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoom;
import com.peopleground.sagwim.chat.domain.repository.ChatRoomRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ChatRoomRepositoryImpl implements ChatRoomRepository {

    private final ChatRoomJpaRepository jpaRepository;
    private final ChatQueryRepository queryRepository;

    @Override
    public ChatRoom save(ChatRoom room) {
        return jpaRepository.save(room);
    }

    @Override
    public Optional<ChatRoom> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<Long> findDirectRoomId(UUID userAId, UUID userBId) {
        return queryRepository.findDirectRoomId(userAId, userBId);
    }
}
