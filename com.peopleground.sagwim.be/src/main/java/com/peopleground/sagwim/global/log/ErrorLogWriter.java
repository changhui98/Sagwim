package com.peopleground.sagwim.global.log;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class ErrorLogWriter {

    private static final Logger errorLogger = LoggerFactory.getLogger("sagwim.error");

    private ErrorLogWriter() {}

    public static void write(HttpServletRequest request, int status) {
        String ip = extractIp(request);
        String userId = extractUserId();
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String fullPath = query != null ? path + "?" + query : path;

        String json = String.format(
            "{\"timestamp\":\"%s\",\"method\":\"%s\",\"path\":\"%s\",\"status\":%d,\"ip\":\"%s\",\"userId\":\"%s\"}",
            Instant.now(),
            escape(request.getMethod()),
            escape(fullPath),
            status,
            escape(ip),
            escape(userId)
        );
        errorLogger.info(json);
    }

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

    private static String extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
