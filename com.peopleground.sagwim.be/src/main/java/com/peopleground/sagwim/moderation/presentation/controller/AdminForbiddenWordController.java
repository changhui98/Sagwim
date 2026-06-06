package com.peopleground.sagwim.moderation.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.moderation.application.ForbiddenWordAdminService;
import com.peopleground.sagwim.moderation.presentation.dto.request.ForbiddenWordRequest;
import com.peopleground.sagwim.moderation.presentation.dto.request.ForbiddenWordStatusRequest;
import com.peopleground.sagwim.moderation.presentation.dto.response.ForbiddenWordResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 금지 단어 CRUD API.
 * ADMIN 또는 MANAGER 권한이 필요하다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/forbidden-words")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminForbiddenWordController {

    private final ForbiddenWordAdminService forbiddenWordAdminService;

    /**
     * 활성 금지 단어 목록 조회 (페이징, 최신 등록순).
     *
     * <p>GET /api/v1/admin/forbidden-words?page=0&size=10</p>
     */
    @GetMapping
    public ResponseEntity<PageResponse<ForbiddenWordResponse>> getForbiddenWords(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(forbiddenWordAdminService.getForbiddenWords(page, size, keyword));
    }

    /**
     * 금지 단어 등록.
     *
     * <p>POST /api/v1/admin/forbidden-words</p>
     */
    @PostMapping
    public ResponseEntity<ForbiddenWordResponse> createForbiddenWord(
        @RequestBody @Valid ForbiddenWordRequest request,
        @AuthenticationPrincipal CustomUser currentUser
    ) {
        ForbiddenWordResponse response = forbiddenWordAdminService.createForbiddenWord(
            request.word(),
            currentUser.getUsername()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 금지 단어 수정.
     *
     * <p>PATCH /api/v1/admin/forbidden-words/{id}</p>
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ForbiddenWordResponse> updateForbiddenWord(
        @PathVariable Long id,
        @RequestBody @Valid ForbiddenWordRequest request
    ) {
        return ResponseEntity.ok(forbiddenWordAdminService.updateForbiddenWord(id, request.word()));
    }

    /**
     * 금지 단어 차단 상태 변경 (ACTIVE/INACTIVE).
     *
     * <p>PATCH /api/v1/admin/forbidden-words/{id}/status</p>
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ForbiddenWordResponse> changeStatus(
        @PathVariable Long id,
        @RequestBody @Valid ForbiddenWordStatusRequest request
    ) {
        return ResponseEntity.ok(forbiddenWordAdminService.changeStatus(id, request.status()));
    }

    /**
     * 금지 단어 삭제 (하드 딜리트).
     *
     * <p>DELETE /api/v1/admin/forbidden-words/{id}</p>
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteForbiddenWord(@PathVariable Long id) {
        forbiddenWordAdminService.deleteForbiddenWord(id);
        return ResponseEntity.noContent().build();
    }
}
