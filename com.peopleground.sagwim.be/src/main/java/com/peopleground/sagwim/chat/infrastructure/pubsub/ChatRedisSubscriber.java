package com.peopleground.sagwim.chat.infrastructure.pubsub;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ChatRedisSubscriber {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public ChatRedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        // Spring Boot 4.x는 Jackson 3 기반이라 com.fasterxml ObjectMapper 빈이 자동 노출되지 않음.
        // RedisConfig 의 직렬화 설정과 동일하게 default typing 을 켠 인스턴스를 자체 생성한다.
        this.objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
            );
    }

    /**
     * Redis 채널에서 수신한 메시지를 WebSocket 구독자에게 브로드캐스트.
     * RedisMessageListenerContainer가 이 메서드를 리플렉션으로 호출한다.
     */
    public void onMessage(Object message, String pattern) {
        try {
            ChatMessageResponse response = objectMapper.convertValue(message, ChatMessageResponse.class);
            String destination = "/topic/chat/room/" + response.roomId();
            messagingTemplate.convertAndSend(destination, response);
        } catch (Exception e) {
            log.error("채팅 메시지 브로드캐스트 실패: {}", e.getMessage());
        }
    }
}
