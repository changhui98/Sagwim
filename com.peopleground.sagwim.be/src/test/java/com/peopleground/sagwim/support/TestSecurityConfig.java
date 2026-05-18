package com.peopleground.sagwim.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * @WebMvcTest 전용 보안 설정.
 *
 * 운영 SecurityConfig 는 JwtTokenProvider, TokenBlacklistService(Redis) 등
 * WebMvcTest 슬라이스에서 자동으로 불러오지 않는 Bean 에 의존한다.
 * 이 설정은 해당 의존성 없이 SecurityFilterChain 만 구성하여
 * 테스트에서 MockMvc SecurityMockMvcRequestPostProcessors.user() 혹은
 * @WithMockUser 를 통한 인증 시뮬레이션이 동작하도록 한다.
 *
 * @EnableMethodSecurity 를 선언하여 @PreAuthorize 메서드 보안도 검증한다.
 */
@TestConfiguration
@EnableMethodSecurity
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
