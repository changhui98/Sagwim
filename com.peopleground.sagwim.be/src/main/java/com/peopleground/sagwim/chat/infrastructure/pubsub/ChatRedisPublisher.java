package com.peopleground.sagwim.chat.infrastructure.pubsub;

import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatRedisPublisher {

    // 채팅 전용 RedisTemplate (Jackson2JsonRedisSerializer<ChatMessageResponse>).
    // 전역 redisTemplate 의 default typing 직렬화기는 record 같은 final 타입에
    // @class 를 붙이지 않아 subscribe 측에서 타입 ID 누락 예외가 발생한다.
    private final RedisTemplate<String, ChatMessageResponse> chatRedisTemplate;

    public void publish(ChatMessageResponse message) {
        String channel = "chat:room:" + message.roomId();
        chatRedisTemplate.convertAndSend(channel, message);
    }
}
