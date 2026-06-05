package com.peopleground.sagwim.global.presentation;

import com.peopleground.sagwim.global.dto.ErrorLogSummaryResponse;
import com.peopleground.sagwim.global.dto.RegistrationLogSummaryResponse;
import com.peopleground.sagwim.global.log.LogFileService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "all") String statusGroup
    ) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now();
        LocalDate effectiveTo = to != null ? to : LocalDate.now();

        // from이 to보다 늦으면 교정
        if (effectiveFrom.isAfter(effectiveTo)) {
            effectiveFrom = effectiveTo;
        }

        List<String> raw = logFileService.getErrorLogs(effectiveFrom, effectiveTo, statusGroup, page, size);
        long total = logFileService.countErrorLogs(effectiveFrom, effectiveTo, statusGroup);
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
        @RequestParam(defaultValue = "50") int size,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now();
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        if (effectiveFrom.isAfter(effectiveTo)) {
            effectiveFrom = effectiveTo;
        }

        List<String> raw = logFileService.getRegistrationLogs(effectiveFrom, effectiveTo, page, size);
        long total = logFileService.countRegistrationLogs(effectiveFrom, effectiveTo);
        return ResponseEntity.ok(Map.of(
            "content", parseLines(raw),
            "page", page,
            "size", size,
            "totalElements", total,
            "totalPages", (int) Math.ceil((double) total / size),
            "hasNext", (long) (page + 1) * size < total
        ));
    }

    @GetMapping("/error/summary")
    public ResponseEntity<ErrorLogSummaryResponse> getErrorLogSummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now();
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        if (effectiveFrom.isAfter(effectiveTo)) {
            effectiveFrom = effectiveTo;
        }
        return ResponseEntity.ok(logFileService.summarizeErrors(effectiveFrom, effectiveTo));
    }

    @GetMapping("/registration/summary")
    public ResponseEntity<RegistrationLogSummaryResponse> getRegistrationLogSummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate effectiveFrom = from != null ? from : LocalDate.now();
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        if (effectiveFrom.isAfter(effectiveTo)) {
            effectiveFrom = effectiveTo;
        }
        return ResponseEntity.ok(logFileService.summarizeRegistrations(effectiveFrom, effectiveTo));
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
