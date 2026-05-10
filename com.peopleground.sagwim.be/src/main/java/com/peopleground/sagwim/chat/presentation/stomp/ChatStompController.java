package com.peopleground.sagwim.chat.presentation.stomp;

import com.peopleground.sagwim.chat.application.service.ChatService;
import com.peopleground.sagwim.chat.infrastructure.websocket.StompHandlerInterceptor;
import com.peopleground.sagwim.chat.presentation.dto.request.SendMessageRequest;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatService chatService;

    /**
     * 클라이언트가 /app/chat/message 로 메시지를 전송하면 처리한다.
     * 인증된 userId는 STOMP CONNECT 단계에서 세션 속성에 저장되어 있다.
     */
    @MessageMapping("/chat/message")
    public void sendMessage(SendMessageRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        UUID senderId = (UUID) sessionAttributes.get("userId");
        chatService.sendMessage(senderId, request);
    }
}
