package com.peopleground.sagwim.chat.infrastructure.websocket;

import com.peopleground.sagwim.chat.domain.ChatErrorCode;
import com.peopleground.sagwim.chat.domain.repository.ChatRoomMemberRepository;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandlerInterceptor implements ChannelInterceptor {

    private static final String USER_ID_ATTR = "userId";
    private static final String USERNAME_ATTR = "username";

    private final JwtTokenProvider jwtTokenProvider;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            authenticateAndSetAttributes(accessor);
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            validateSubscription(accessor);
        }

        return message;
    }

    private void authenticateAndSetAttributes(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        String token = null;

        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }

        if (token == null || !jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        UUID userId = jwtTokenProvider.getUserId(token);
        String username = jwtTokenProvider.getUsername(token);

        accessor.getSessionAttributes().put(USER_ID_ATTR, userId);
        accessor.getSessionAttributes().put(USERNAME_ATTR, username);
        log.debug("WebSocket CONNECT 인증 완료: userId={}", userId);
    }

    private void validateSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith("/topic/chat/room/")) {
            return;
        }

        UUID userId = (UUID) accessor.getSessionAttributes().get(USER_ID_ATTR);
        if (userId == null) {
            throw new IllegalStateException("인증 정보가 없습니다.");
        }

        String roomIdStr = destination.substring("/topic/chat/room/".length());
        Long roomId = Long.parseLong(roomIdStr);

        chatRoomMemberRepository.findActiveByRoomAndUser(roomId, userId)
            .orElseThrow(() -> new AppException(ChatErrorCode.NOT_ROOM_MEMBER));
    }
}
