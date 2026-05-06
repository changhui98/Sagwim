package com.peopleground.sagwim.global.log;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.util.ContentCachingRequestWrapper;

public final class ErrorLogWriter {

    private static final Logger errorLogger = LoggerFactory.getLogger("sagwim.error");

    /** request body에서 마스킹할 필드 이름 (소문자 비교) */
    private static final Set<String> SENSITIVE_KEYS = Set.of("password", "newpassword", "currentpassword");

    /** 저장할 stacktrace 최대 문자 수 */
    private static final int STACK_TRACE_MAX_CHARS = 2000;

    private ErrorLogWriter() {}

    /**
     * 예외 없이 상태 코드만 있는 경우 (4xx 비즈니스 예외, 인증 실패 등)
     */
    public static void write(HttpServletRequest request, int status) {
        write(request, status, null, null);
    }

    /**
     * 예외 메시지만 있는 경우 (AppException, Validation 등)
     */
    public static void write(HttpServletRequest request, int status, String errorMessage) {
        write(request, status, errorMessage, null);
    }

    /**
     * 예외 객체까지 있는 경우 (5xx 등 비예상 예외)
     */
    public static void write(HttpServletRequest request, int status, Throwable t) {
        write(request, status, t != null ? t.getMessage() : null, t);
    }

    private static void write(HttpServletRequest request, int status, String errorMessage, Throwable t) {
        String ip = extractIp(request);
        String username = extractUsername();
        String path = request.getRequestURI();
        String queryParams = request.getQueryString();
        String method = request.getMethod();
        String requestBody = extractRequestBody(request);
        String stackTrace = formatStackTrace(t);

        // JSON 필드를 StringBuilder로 수동 조립 (외부 의존성 없이)
        StringBuilder sb = new StringBuilder("{");
        appendField(sb, "timestamp", Instant.now().toString(), true);
        appendField(sb, "method", method, false);
        appendField(sb, "path", path, false);
        appendNumericField(sb, "status", status);
        appendField(sb, "ip", ip, false);
        appendField(sb, "username", username, false);
        appendField(sb, "queryParams", queryParams, false);
        appendField(sb, "requestBody", requestBody, false);
        appendField(sb, "errorMessage", errorMessage, false);
        appendField(sb, "stacktrace", stackTrace, false);
        sb.append("}");

        errorLogger.info(sb.toString());
    }

    // ── 요청 바디 추출 ──────────────────────────────────────────────────────

    private static String extractRequestBody(HttpServletRequest request) {
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            byte[] buf = wrapper.getContentAsByteArray();
            if (buf.length == 0) return null;
            String body = new String(buf, StandardCharsets.UTF_8);
            return maskSensitiveFields(body);
        }
        // ContentCachingRequestWrapper로 래핑되지 않은 경우 (스트림 재읽기 불가)
        return null;
    }

    /**
     * JSON body에서 민감 필드 값을 "***"로 마스킹.
     * 정규식 기반 단순 치환 — 완전한 JSON 파싱이 아니므로 중첩 객체까지는 처리하지 않음.
     */
    static String maskSensitiveFields(String body) {
        if (body == null || body.isBlank()) return body;
        String result = body;
        for (String key : SENSITIVE_KEYS) {
            // "password":"somevalue" 또는 "password": "somevalue" 형식 모두 처리
            result = result.replaceAll(
                "(?i)(\"" + key + "\"\\s*:\\s*)\"[^\"]*\"",
                "$1\"***\""
            );
        }
        return result;
    }

    // ── 스택트레이스 포맷 ───────────────────────────────────────────────────

    private static String formatStackTrace(Throwable t) {
        if (t == null) return null;
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        String full = sw.toString();
        if (full.length() <= STACK_TRACE_MAX_CHARS) return full.stripTrailing();
        return full.substring(0, STACK_TRACE_MAX_CHARS) + "\n... (truncated)";
    }

    // ── JSON 조립 헬퍼 ──────────────────────────────────────────────────────

    private static void appendField(StringBuilder sb, String key, String value, boolean first) {
        if (!first) sb.append(",");
        sb.append("\"").append(key).append("\":");
        if (value == null) {
            sb.append("null");
        } else {
            sb.append("\"").append(escapeJson(value)).append("\"");
        }
    }

    private static void appendNumericField(StringBuilder sb, String key, int value) {
        sb.append(",\"").append(key).append("\":").append(value);
    }

    // ── 공통 유틸 ───────────────────────────────────────────────────────────

    private static String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) {
            return cfIp.trim();
        }
        return request.getRemoteAddr();
    }

    private static String extractUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }

    private static String escapeJson(String value) {
        if (value == null) return "";
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r\n", "\\n")
            .replace("\n", "\\n")
            .replace("\r", "\\n")
            .replace("\t", "\\t");
    }
}
