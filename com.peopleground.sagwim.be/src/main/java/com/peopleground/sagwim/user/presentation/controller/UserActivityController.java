package com.peopleground.sagwim.user.presentation.controller;

import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.user.application.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users/me/activity")
public class UserActivityController {

    private final UserActivityService userActivityService;

    /**
     * 내가 좋아요를 누른 게시글 목록 조회.
     * GET /api/v1/users/me/activity/liked-posts?page=0&size=10
     */
    @GetMapping("/liked-posts")
    public ResponseEntity<PageResponse<ContentResponse>> getLikedPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        return ResponseEntity.ok(userActivityService.getLikedContents(customUser, page, size));
    }

    /**
     * 내가 좋아요를 누른 모임 목록 조회.
     * GET /api/v1/users/me/activity/liked-groups?page=0&size=10
     */
    @GetMapping("/liked-groups")
    public ResponseEntity<PageResponse<GroupResponse>> getLikedGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        return ResponseEntity.ok(userActivityService.getLikedGroups(customUser, page, size));
    }

    /**
     * 내가 댓글을 작성한 게시글 목록 조회.
     * GET /api/v1/users/me/activity/commented-posts?page=0&size=10
     */
    @GetMapping("/commented-posts")
    public ResponseEntity<PageResponse<ContentResponse>> getCommentedPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        return ResponseEntity.ok(userActivityService.getCommentedContents(customUser, page, size));
    }
}
