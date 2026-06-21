package com.peopleground.sagwim.global.security;

import com.peopleground.sagwim.global.configure.CorsConfig;
import com.peopleground.sagwim.global.exception.JsonAccessDeniedHandler;
import com.peopleground.sagwim.global.exception.JsonAuthenticationEntryPoint;
import com.peopleground.sagwim.global.redis.TokenBlacklistService;
import com.peopleground.sagwim.global.security.jwt.JwtAuthenticationFilter;
import com.peopleground.sagwim.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import jakarta.servlet.DispatcherType;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectMapper objectMapper;
    private final CorsConfigurationSource corsConfigurationSource;
    private final TokenBlacklistService tokenBlacklistService;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg)
        throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public AuthenticationFilter authenticationFilter(AuthenticationManager authenticationManager) throws Exception {
        AuthenticationFilter filter = new AuthenticationFilter(jwtTokenProvider, objectMapper);
        filter.setAuthenticationManager(authenticationManager);
        return filter;
    }

    /**
     * AuthenticationFilter를 서블릿 컨테이너에 직접 등록하지 않도록 방지한다.
     * Spring Boot는 Filter 타입의 @Bean을 자동으로 서블릿 컨테이너에 등록하는데,
     * SecurityFilterChain에 이미 포함된 필터가 서블릿 레벨에서 이중 실행되면
     * /api/v1/auth/sign-in 요청이 Security 필터 체인에 도달하기 전에 처리되어
     * 예상치 못한 404 또는 인증 오류가 발생한다.
     */
    @Bean
    public FilterRegistrationBean<AuthenticationFilter> authenticationFilterRegistration(
        AuthenticationFilter authenticationFilter
    ) {
        FilterRegistrationBean<AuthenticationFilter> registration = new FilterRegistrationBean<>(authenticationFilter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * 요청 바디 캐싱 필터를 서블릿 컨테이너 최우선 순위로 등록한다.
     *
     * Security 필터 체인보다 먼저 실행되어야 ErrorLogWriter가 request body를 읽을 수 있다.
     * AuthenticationFilter는 InputStream을 직접 읽으므로 이 필터가 반드시 선행되어야 한다.
     */
    @Bean
    public FilterRegistrationBean<RequestCachingFilter> requestCachingFilterRegistration() {
        FilterRegistrationBean<RequestCachingFilter> registration =
            new FilterRegistrationBean<>(new RequestCachingFilter());
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, AuthenticationFilter authenticationFilter) throws Exception {

        http
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .csrf(AbstractHttpConfigurer::disable)
            // form 로그인/HTTP Basic 비활성화: JWT 기반 Stateless 인증만 사용
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            // CORS 필터를 Security 체인 최우선으로 등록
            // — Spring Security의 CorsFilter가 preflight(OPTIONS) 요청을 인증 검사 전에 처리하므로
            //   CORS 설정이 올바르면 401 없이 200 OK를 반환한다.
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .authorizeHttpRequests(auth ->
                auth
                    // Spring Security 6은 기본적으로 ASYNC/ERROR 디스패치까지 인증을 재검사한다.
                    // SSE(/notifications/stream) 같은 비동기 응답은 타임아웃·종료 시 ASYNC 로 재디스패치되는데
                    // 그 시점 비동기 스레드에는 SecurityContext 가 없어 AuthorizationDeniedException 이 발생한다.
                    // ASYNC/ERROR 디스패치는 이미 REQUEST 단계에서 인증된 요청의 연속이므로 허용한다.
                    .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                    // CORS preflight(OPTIONS) 요청은 인증 없이 허용
                    // — .cors()만으로도 처리되지만 명시적으로 선언해 의도를 분명히 함
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    // Docker 헬스체크 및 모니터링 (인증 불필요)
                    .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                    // Swagger UI (개발/운영 모두 접근 허용 — 필요 시 prod 프로파일에서 비활성화)
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    // 로그아웃은 인증 필요 (토큰을 블랙리스트에 등록해야 하므로)
                    .requestMatchers(HttpMethod.POST, "/api/v1/auth/sign-out").authenticated()
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // 태그 관련 공개 API (비로그인 사용자도 태그 검색 가능)
                    .requestMatchers("/api/v1/tags/**").permitAll()
                    // 댓글 목록 조회 공개 API (비로그인 사용자도 댓글 조회 가능)
                    .requestMatchers(HttpMethod.GET, "/api/v1/contents/*/comments").permitAll()
                    // 이미지 조회 공개 API (비로그인 사용자도 이미지 조회 가능)
                    .requestMatchers(HttpMethod.GET, "/api/v1/images").permitAll()
                    .requestMatchers("/images/**").permitAll()
                    // FAQ 공개 조회 API (비로그인 사용자도 자주 묻는 질문 조회 가능)
                    .requestMatchers(HttpMethod.GET, "/api/v1/faqs").permitAll()
                    // 모임 일정 목록 조회 공개 API (비로그인 사용자도 조회 가능, attendingByMe는 false 반환)
                    .requestMatchers(HttpMethod.GET, "/api/v1/groups/*/schedules").permitAll()
                    // 이번 주 일정 모임 조회 공개 API (비로그인 사용자도 조회 가능, isLiked는 false 반환)
                    .requestMatchers(HttpMethod.GET, "/api/v1/groups/thisweek").permitAll()
                    // WebSocket 핸드셰이크는 HTTP 레벨에서 인증 없이 허용
                    // 실제 인증은 STOMP CONNECT 단계의 StompHandlerInterceptor에서 처리한다.
                    // /ws-chat: 웹 SockJS, /ws-chat-native: 모바일 raw WebSocket
                    .requestMatchers("/ws-chat/**", "/ws-chat-native", "/ws-chat-native/**").permitAll()
                    .anyRequest().authenticated())

            .exceptionHandling(e ->
                e.accessDeniedHandler(new JsonAccessDeniedHandler())
                    .authenticationEntryPoint(new JsonAuthenticationEntryPoint()))

            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, tokenBlacklistService), AuthenticationFilter.class)

            .addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();
    }
}
