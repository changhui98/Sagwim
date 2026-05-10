package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatRoomMember;
import com.peopleground.sagwim.chat.domain.repository.ChatRoomMemberRepository;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomSummaryResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ChatRoomMemberRepositoryImpl implements ChatRoomMemberRepository {

    private final ChatRoomMemberJpaRepository jpaRepository;
    private final ChatQueryRepository queryRepository;

    @Override
    public ChatRoomMember save(ChatRoomMember member) {
        return jpaRepository.save(member);
    }

    @Override
    public Optional<ChatRoomMember> findActiveByRoomAndUser(Long roomId, UUID userId) {
        return jpaRepository.findActiveByRoomAndUser(roomId, userId);
    }

    @Override
    public List<ChatRoomSummaryResponse> findRoomSummaries(UUID userId, Long cursor, int size) {
        return queryRepository.findRoomSummaries(userId, cursor, size);
    }
}
