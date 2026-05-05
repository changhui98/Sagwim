package com.peopleground.sagwim.global.presentation;

import com.peopleground.sagwim.global.log.LogFileService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminLogController {

    private final LogFileService logFileService;
    private final ObjectMapper objectMapper;

    @GetMapping("/error")
    public ResponseEntity<Map<String, Object>> getErrorLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        List<String> raw = logFileService.getErrorLogs(page, size);
        long total = logFileService.countErrorLogs();
        return ResponseEntity.ok(Map.of(
            "content", parseLines(raw),
            "page", page,
            "size", size,
            "totalElements", total,
            "totalPages", (int) Math.ceil((double) total / size),
            "hasNext", (long) (page + 1) * size < total
        ));
    }

    @GetMapping("/registration")
    public ResponseEntity<Map<String, Object>> getRegistrationLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        List<String> raw = logFileService.getRegistrationLogs(page, size);
        long total = logFileService.countRegistrationLogs();
        return ResponseEntity.ok(Map.of(
            "content", parseLines(raw),
            "page", page,
            "size", size,
            "totalElements", total,
            "totalPages", (int) Math.ceil((double) total / size),
            "hasNext", (long) (page + 1) * size < total
        ));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLogs() {
        return logFileService.stream();
    }

    @SuppressWarnings("unchecked")
    private List<Object> parseLines(List<String> lines) {
        return lines.stream().map(line -> {
            try {
                return (Object) objectMapper.readValue(line, Map.class);
            } catch (Exception e) {
                return (Object) Map.of("raw", line);
            }
        }).toList();
    }
}
