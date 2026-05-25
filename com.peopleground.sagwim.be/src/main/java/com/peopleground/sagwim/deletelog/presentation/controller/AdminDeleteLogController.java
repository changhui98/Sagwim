package com.peopleground.sagwim.deletelog.presentation.controller;

import com.peopleground.sagwim.deletelog.application.service.DeleteLogService;
import com.peopleground.sagwim.deletelog.presentation.dto.response.DeleteLogResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/delete-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminDeleteLogController {

    private final DeleteLogService deleteLogService;

    @GetMapping
    public ResponseEntity<PageResponse<DeleteLogResponse>> getDeleteLogs(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        if (from != null || to != null) {
            LocalDate effectiveFrom = from != null ? from : LocalDate.now();
            LocalDate effectiveTo = to != null ? to : LocalDate.now();
            if (effectiveFrom.isAfter(effectiveTo)) {
                effectiveFrom = effectiveTo;
            }
            return ResponseEntity.ok(deleteLogService.findAll(effectiveFrom, effectiveTo, page, size));
        }
        return ResponseEntity.ok(deleteLogService.findAll(page, size));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<DeleteLogResponse> restore(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUser adminUser
    ) {
        DeleteLogResponse response = deleteLogService.restore(id, adminUser.getUsername());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
