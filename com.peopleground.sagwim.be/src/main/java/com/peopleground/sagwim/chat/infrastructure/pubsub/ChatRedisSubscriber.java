package com.peopleground.sagwim.chat.infrastructure.pubsub;

import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatRedisSubscriber {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Redis 채널에서 수신한 ChatMessageResponse 를 WebSocket 구독자에게 브로드캐스트.
     * RedisMessageListenerContainer 가 이 메서드를 리플렉션으로 호출한다.
     *
     * <p>MessageListenerAdapter 에 등록된 Jackson2JsonRedisSerializer 가 직접
     * ChatMessageResponse 로 역직렬화하므로, convertValue 같은 추가 변환이 필요 없다.</p>
     */
    public void onMessage(ChatMessageResponse response, String pattern) {
        try {
            String destination = "/topic/chat/room/" + response.roomId();
            messagingTemplate.convertAndSend(destination, response);
        } catch (Exception e) {
            log.error("채팅 메시지 브로드캐스트 실패: {}", e.getMessage());
        }
    }
}
