package com.peopleground.sagwim.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

/**
 * 모든 요청 바디를 캐싱하는 필터.
 *
 * <p>HttpServletRequest의 InputStream은 한 번 읽으면 소비되므로,
 * {@link ContentCachingRequestWrapper}로 래핑해서 이후 필터/핸들러에서
 * 바디를 여러 번 읽을 수 있게 한다.</p>
 *
 * <p>주로 {@link com.peopleground.sagwim.global.log.ErrorLogWriter}가
 * 에러 발생 시 requestBody를 기록하는 데 사용된다.</p>
 *
 * <p>Security 필터 체인보다 먼저 실행되도록 {@link SecurityConfig}에서
 * {@code FilterRegistrationBean}으로 ORDER_HIGHEST 우선순위로 등록한다.</p>
 */
public class RequestCachingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        // 이미 래핑된 경우 재래핑하지 않는다
        if (request instanceof ContentCachingRequestWrapper) {
            filterChain.doFilter(request, response);
            return;
        }

        // Spring 7.x에서는 cacheLimit 인자가 필수다. 0을 넘기면 무제한으로 동작한다.
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request, 0);
        filterChain.doFilter(wrappedRequest, response);
    }
}
