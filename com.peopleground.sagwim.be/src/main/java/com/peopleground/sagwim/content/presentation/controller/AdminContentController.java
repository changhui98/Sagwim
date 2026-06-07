package com.peopleground.sagwim.content.presentation.controller;

import com.peopleground.sagwim.content.application.service.AdminContentService;
import com.peopleground.sagwim.content.presentation.dto.request.AdminContentUpdateRequest;
import com.peopleground.sagwim.content.presentation.dto.request.AdminDeleteContentRequest;
import com.peopleground.sagwim.content.presentation.dto.response.AdminContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/contents")
@RequiredArgsConstructor
public class AdminContentController {

    private final AdminContentService adminContentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PageResponse<AdminContentResponse>> getAllContents(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String searchField
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminContentService.getAllContents(page, size, keyword, searchField));
    }

    @GetMapping("/{contentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminContentResponse> getContent(@PathVariable Long contentId) {
        return ResponseEntity.status(HttpStatus.OK).body(adminContentService.getContent(contentId));
    }

    @PatchMapping("/{contentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminContentResponse> updateContent(
        @PathVariable Long contentId,
        @RequestBody @Valid AdminContentUpdateRequest req
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminContentService.updateContent(contentId, req));
    }

    @DeleteMapping("/{contentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteContent(
        @PathVariable Long contentId,
        @RequestBody @Valid AdminDeleteContentRequest request,
        @AuthenticationPrincipal CustomUser adminUser
    ) {
        adminContentService.deleteContent(contentId, adminUser, request.reason());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PatchMapping("/{contentId}/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<AdminContentResponse> restoreContent(
        @PathVariable Long contentId,
        @AuthenticationPrincipal CustomUser adminUser
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminContentService.restoreContent(contentId, adminUser.getUsername()));
    }
}
