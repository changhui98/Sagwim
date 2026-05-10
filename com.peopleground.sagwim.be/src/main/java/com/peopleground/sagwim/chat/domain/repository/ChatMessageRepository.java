package com.peopleground.sagwim.chat.domain.repository;

import com.peopleground.sagwim.chat.domain.entity.ChatMessage;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import java.util.List;

public interface ChatMessageRepository {

    ChatMessage save(ChatMessage message);

    /**
     * 커서 기반 메시지 페이징 (id DESC). cursor 이전 메시지 조회.
     * N+1 차단: sender 정보를 fetch join으로 한번에 가져온다.
     */
    List<ChatMessageResponse> findMessages(Long roomId, Long cursor, int size);
}
