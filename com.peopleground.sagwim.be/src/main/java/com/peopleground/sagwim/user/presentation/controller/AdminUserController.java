package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.user.application.AdminUserService;
import com.peopleground.sagwim.user.presentation.dto.request.AdminDeleteUserRequest;
import com.peopleground.sagwim.user.presentation.dto.request.ChangeUserRoleRequest;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserDetailResponse;
import com.peopleground.sagwim.user.presentation.dto.response.AdminUserResponse;
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
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> getUsersForAdmin(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String searchField
    ) {
        PageResponse<AdminUserResponse> res = adminUserService.getUsersForAdmin(page, size, keyword, searchField);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @GetMapping("/{username}")
    public ResponseEntity<AdminUserDetailResponse> getUserForAdmin(
        @PathVariable String username
    ) {
        AdminUserDetailResponse res = adminUserService.getUserForAdmin(username);

        return ResponseEntity.status(HttpStatus.OK).body(res);
    }

    @DeleteMapping("/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUserForAdmin(
        @PathVariable String username,
        @RequestBody @Valid AdminDeleteUserRequest request,
        @AuthenticationPrincipal CustomUser currentUser
    ) {
        adminUserService.deleteUserForAdmin(currentUser.getUsername(), username, request.reason());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{username}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDetailResponse> restoreUserForAdmin(
        @PathVariable String username,
        @AuthenticationPrincipal CustomUser currentUser
    ) {
        return ResponseEntity.ok(adminUserService.restoreUserForAdmin(currentUser.getUsername(), username));
    }

    @PatchMapping("/{username}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> changeUserRole(
        @PathVariable String username,
        @RequestBody @Valid ChangeUserRoleRequest request,
        @AuthenticationPrincipal CustomUser currentUser
    ) {
        adminUserService.changeUserRole(currentUser.getUsername(), username, request.role());

        return ResponseEntity.noContent().build();
    }
}
