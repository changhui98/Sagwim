package com.peopleground.sagwim.global.log;

import jakarta.servlet.http.HttpServletRequest;
import java.io.PrintWriter;
import java.io.StringWriter;
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

    public static void write(HttpServletRequest request, int status, Throwable t) {
        String ip = extractIp(request);
        String userId = extractUserId();
        String path = request.getRequestURI();
        String query = request.getQueryString();
        String fullPath = query != null ? path + "?" + query : path;

        String json = String.format(
            "{\"timestamp\":\"%s\",\"method\":\"%s\",\"path\":\"%s\",\"status\":%d,\"ip\":\"%s\",\"userId\":\"%s\",\"stacktrace\":\"%s\"}",
            Instant.now(),
            escape(request.getMethod()),
            escape(fullPath),
            status,
            escape(ip),
            escape(userId),
            formatStackTrace(t)
        );
        errorLogger.info(json);
    }

    private static String formatStackTrace(Throwable t) {
        if (t == null) return "";
        StringWriter sw = new StringWriter();
        t.printStackTrace(new PrintWriter(sw));
        String[] lines = sw.toString().split("\n");
        int limit = Math.min(lines.length, 20);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < limit; i++) {
            if (i > 0) sb.append("\\n");
            sb.append(escape(lines[i].stripTrailing()));
        }
        if (lines.length > 20) sb.append("\\n... (").append(lines.length - 20).append(" more lines)");
        return sb.toString();
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
