package com.peopleground.sagwim.chat.infrastructure.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatMessage;
import com.peopleground.sagwim.chat.domain.repository.ChatMessageRepository;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ChatMessageRepositoryImpl implements ChatMessageRepository {

    private final ChatMessageJpaRepository jpaRepository;
    private final ChatQueryRepository queryRepository;

    @Override
    public ChatMessage save(ChatMessage message) {
        return jpaRepository.save(message);
    }

    @Override
    public List<ChatMessageResponse> findMessages(Long roomId, Long cursor, int size) {
        return queryRepository.findMessages(roomId, cursor, size);
    }
}
