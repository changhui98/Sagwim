package com.peopleground.sagwim.global.configure;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .toList();
        config.setAllowedOriginPatterns(origins);

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // preflight 요청에서 허용할 요청 헤더를 와일드카드로 지정한다.
        // allowedOriginPatterns + allowCredentials(true) 조합에서는 "*" 사용이 허용된다.
        // 특정 헤더를 명시하면 브라우저가 예상치 못한 헤더(예: cache-control, pragma)를
        // Access-Control-Request-Headers에 포함했을 때 preflight가 거부될 수 있다.
        config.setAllowedHeaders(List.of("*"));

        config.setAllowCredentials(true);

        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // 모바일(React Native) WebSocket 핸드셰이크는 임의의 Origin(예: http://localhost:8081)을
        // 전송하므로 웹용 allowedOrigins 로 제한하면 CORS 단계에서 403 으로 거부된다.
        // 이 엔드포인트는 브라우저가 아닌 네이티브 클라이언트 전용이고 인증은 STOMP CONNECT
        // 단계의 토큰으로 수행하므로 모든 Origin 을 허용한다(credentials 불필요).
        CorsConfiguration wsConfig = new CorsConfiguration();
        wsConfig.setAllowedOriginPatterns(List.of("*"));
        wsConfig.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        wsConfig.setAllowedHeaders(List.of("*"));
        wsConfig.setAllowCredentials(false);
        source.registerCorsConfiguration("/ws-chat-native", wsConfig);
        source.registerCorsConfiguration("/ws-chat-native/**", wsConfig);

        source.registerCorsConfiguration("/**", config);

        return source;
    }

}
