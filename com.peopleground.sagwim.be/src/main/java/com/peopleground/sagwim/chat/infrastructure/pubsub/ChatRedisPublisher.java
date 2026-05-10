package com.peopleground.sagwim.chat.infrastructure.pubsub;

import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatRedisPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(ChatMessageResponse message) {
        String channel = "chat:room:" + message.roomId();
        redisTemplate.convertAndSend(channel, message);
    }
}
