package com.peopleground.sagwim.group.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.application.service.AdminGroupService;
import com.peopleground.sagwim.group.presentation.dto.request.AdminDeleteGroupRequest;
import com.peopleground.sagwim.group.presentation.dto.response.AdminGroupResponse;
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
@RequestMapping("/api/v1/admin/groups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminGroupController {

    private final AdminGroupService adminGroupService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminGroupResponse>> getAllGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String searchField
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(adminGroupService.getAllGroups(page, size, keyword, searchField));
    }

    @PatchMapping("/{groupId}/approve")
    public ResponseEntity<AdminGroupResponse> approveGroup(@PathVariable Long groupId) {
        return ResponseEntity.status(HttpStatus.OK).body(adminGroupService.approveGroup(groupId));
    }

    @PatchMapping("/{groupId}/reject")
    public ResponseEntity<AdminGroupResponse> rejectGroup(@PathVariable Long groupId) {
        return ResponseEntity.status(HttpStatus.OK).body(adminGroupService.rejectGroup(groupId));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
        @PathVariable Long groupId,
        @RequestBody @Valid AdminDeleteGroupRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        adminGroupService.deleteGroup(groupId, customUser, request.reason());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{groupId}/restore")
    public ResponseEntity<AdminGroupResponse> restoreGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        return ResponseEntity.ok(adminGroupService.restoreGroup(groupId, customUser));
    }
}
