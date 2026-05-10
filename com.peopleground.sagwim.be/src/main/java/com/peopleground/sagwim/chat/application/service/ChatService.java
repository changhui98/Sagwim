package com.peopleground.sagwim.chat.application.service;

import com.peopleground.sagwim.chat.domain.ChatErrorCode;
import com.peopleground.sagwim.chat.domain.entity.ChatMessage;
import com.peopleground.sagwim.chat.domain.entity.ChatRoom;
import com.peopleground.sagwim.chat.domain.entity.ChatRoomMember;
import com.peopleground.sagwim.chat.domain.repository.ChatMessageRepository;
import com.peopleground.sagwim.chat.domain.repository.ChatRoomMemberRepository;
import com.peopleground.sagwim.chat.domain.repository.ChatRoomRepository;
import com.peopleground.sagwim.chat.infrastructure.pubsub.ChatRedisPublisher;
import com.peopleground.sagwim.chat.presentation.dto.request.SendMessageRequest;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomResponse;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomSummaryResponse;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatRedisPublisher redisPublisher;
    private final UserRepository userRepository;

    /**
     * 1:1 방 생성 또는 기존 방 반환.
     * 이미 두 사람 모두 활성 멤버인 방이 있으면 재사용하여 중복 방 생성을 방지한다.
     */
    @Transactional
    public ChatRoomResponse getOrCreateDirectRoom(UUID myId, UUID targetId) {
        if (myId.equals(targetId)) {
            throw new AppException(ChatErrorCode.CANNOT_CHAT_SELF);
        }

        return chatRoomRepository.findDirectRoomId(myId, targetId)
            .map(ChatRoomResponse::new)
            .orElseGet(() -> {
                User me = getUser(myId);
                User target = getUser(targetId);

                ChatRoom room = chatRoomRepository.save(ChatRoom.ofDirect());
                chatRoomMemberRepository.save(ChatRoomMember.of(room, me));
                chatRoomMemberRepository.save(ChatRoomMember.of(room, target));

                return new ChatRoomResponse(room.getId());
            });
    }

    /**
     * 내 채팅방 목록 (cursor 기반 무한스크롤).
     * N+1 없이 단일 쿼리로 상대방 정보 + 마지막 메시지 + 안읽은 수를 조합해 반환한다.
     */
    @Transactional(readOnly = true)
    public PageResponse<ChatRoomSummaryResponse> getRooms(UUID userId, Long cursor, int size) {
        List<ChatRoomSummaryResponse> raw = new ArrayList<>(
            chatRoomMemberRepository.findRoomSummaries(userId, cursor, size)
        );
        boolean hasNext = PageResponse.trim(raw, size);
        return PageResponse.ofSlice(raw, 0, size, hasNext);
    }

    /**
     * 메시지 페이징 조회 (cursor: messageId 기준 역순).
     * 발신자 정보는 DTO projection으로 한번에 조립 — 추가 쿼리 없음.
     */
    @Transactional(readOnly = true)
    public PageResponse<ChatMessageResponse> getMessages(UUID userId, Long roomId, Long cursor, int size) {
        validateActiveMember(roomId, userId);

        List<ChatMessageResponse> raw = new ArrayList<>(
            chatMessageRepository.findMessages(roomId, cursor, size)
        );
        boolean hasNext = PageResponse.trim(raw, size);
        return PageResponse.ofSlice(raw, 0, size, hasNext);
    }

    /**
     * 메시지 전송 플로우:
     * 1. 발신자가 활성 멤버인지 검증
     * 2. PostgreSQL 영속화 (트랜잭션 안)
     * 3. Redis Pub/Sub 발행 → subscriber가 WebSocket 브로드캐스트
     *
     * sender를 별도로 fetch해서 LAZY 프록시가 트랜잭션 경계 밖에서 초기화되지 않도록 한다.
     */
    @Transactional
    public void sendMessage(UUID senderId, SendMessageRequest request) {
        ChatRoomMember member = validateActiveMember(request.roomId(), senderId);
        ChatRoom room = member.getRoom();
        User sender = getUser(senderId);

        ChatMessage saved = chatMessageRepository.save(
            ChatMessage.of(room, sender, request.content(), request.resolvedType())
        );

        ChatMessageResponse response = ChatMessageResponse.from(saved);
        redisPublisher.publish(response);
    }

    /**
     * 마지막 읽은 메시지 ID 갱신 (안읽은 수 계산 기준점).
     */
    @Transactional
    public void markAsRead(UUID userId, Long roomId, Long lastMessageId) {
        ChatRoomMember member = validateActiveMember(roomId, userId);
        member.updateLastRead(lastMessageId);
    }

    /**
     * 사용자 본인 시점에서 방 숨김 (soft delete).
     * 상대방은 계속 대화 가능하며, 히스토리는 보존된다.
     */
    @Transactional
    public void leaveRoom(UUID userId, Long roomId) {
        ChatRoomMember member = validateActiveMember(roomId, userId);
        member.leave();
    }

    private ChatRoomMember validateActiveMember(Long roomId, UUID userId) {
        return chatRoomMemberRepository.findActiveByRoomAndUser(roomId, userId)
            .orElseThrow(() -> new AppException(ChatErrorCode.NOT_ROOM_MEMBER));
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }
}
