package com.peopleground.sagwim.image.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.image.application.service.ImageAdminService;
import com.peopleground.sagwim.image.presentation.dto.request.AdminDeleteImageRequest;
import com.peopleground.sagwim.image.presentation.dto.response.AdminImageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("imageAdminController")
@RequestMapping("/api/v1/admin/images")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminImageController {

    private final ImageAdminService imageAdminService;

    @GetMapping
    public ResponseEntity<PageResponse<AdminImageResponse>> getAllImages(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(imageAdminService.getAllImagesForAdmin(page, size));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteImage(
        @PathVariable Long imageId,
        @RequestBody @Valid AdminDeleteImageRequest request,
        @AuthenticationPrincipal CustomUser currentUser
    ) {
        imageAdminService.deleteImageForAdmin(imageId, currentUser.getUsername(), request.reason());
        return ResponseEntity.noContent().build();
    }
}
