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
        // RN 의 WebSocket 은 임의의 Origin 헤더(예: http://localhost:8081)를 보내므로
        // 웹용 allowedOrigins 로 제한하면 핸드셰이크가 403 으로 거부된다.
        // 모바일은 동일출처정책이 없고 실제 인증은 STOMP CONNECT 단계의 토큰으로 수행하므로
        // 모든 Origin 을 허용한다.
        registry.addEndpoint("/ws-chat-native")
            .setAllowedOriginPatterns("*");
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
