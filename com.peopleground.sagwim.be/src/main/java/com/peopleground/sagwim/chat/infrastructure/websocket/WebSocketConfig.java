package com.peopleground.sagwim.chat.infrastructure.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompHandlerInterceptor stompHandlerInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 웹 클라이언트용 SockJS 엔드포인트 (기존 유지)
        registry.addEndpoint("/ws-chat")
            .setAllowedOriginPatterns(allowedOrigins.split(","))
            .withSockJS();

        // 모바일(React Native) 클라이언트용 raw WebSocket 엔드포인트
        registry.addEndpoint("/ws-chat-native")
            .setAllowedOriginPatterns(allowedOrigins.split(","));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트 구독 prefix
        registry.enableSimpleBroker("/topic");
        // 클라이언트 → 서버 전송 prefix
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompHandlerInterceptor);
    }
}
