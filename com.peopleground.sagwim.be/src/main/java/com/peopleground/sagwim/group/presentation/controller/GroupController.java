package com.peopleground.sagwim.group.presentation.controller;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.application.service.GroupService;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.presentation.dto.request.GroupCreateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupJoinQuestionsUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupJoinRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.response.GroupDetailResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupJoinRequestResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupMemberResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/groups")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
        @Valid @RequestBody GroupCreateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.createGroup(request, customUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<GroupResponse>> getGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) GroupCategory category,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        PageResponse<GroupResponse> response = groupService.getGroups(page, size, keyword, category, customUser);
        return ResponseEntity.ok(response);
    }

    /**
     * 이번 주(월~일)에 일정이 있는 모임 목록을 조회합니다.
     * 비로그인도 조회 가능합니다.
     */
    @GetMapping("/thisweek")
    public ResponseEntity<List<GroupResponse>> getGroupsWithThisWeekSchedule() {
        UUID userId = null;
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUser customUser) {
            userId = customUser.getId();
        }
        List<GroupResponse> response = groupService.getGroupsWithThisWeekSchedule(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 생성된 지 7일 미만인 신규 모임 목록을 조회합니다.
     */
    @GetMapping("/recent")
    public ResponseEntity<PageResponse<GroupResponse>> getNewGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        PageResponse<GroupResponse> response = groupService.getNewGroups(page, size, customUser);
        return ResponseEntity.ok(response);
    }

    /**
     * 좋아요 수 내림차순으로 인기 모임 목록을 조회합니다.
     */
    @GetMapping("/popular")
    public ResponseEntity<PageResponse<GroupResponse>> getPopularGroups(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        PageResponse<GroupResponse> response = groupService.getPopularGroups(page, size, customUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDetailResponse> getGroup(@PathVariable Long groupId) {
        GroupDetailResponse response = groupService.getGroup(groupId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping(value = "/{groupId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GroupResponse> updateGroupImage(
        @PathVariable Long groupId,
        @RequestParam("file") MultipartFile file,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.updateGroupImage(groupId, file, customUser);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{groupId}")
    public ResponseEntity<GroupResponse> updateGroup(
        @PathVariable Long groupId,
        @Valid @RequestBody GroupUpdateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        GroupResponse response = groupService.updateGroup(groupId, request, customUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.deleteGroup(groupId, customUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{groupId}/join-questions")
    public ResponseEntity<List<String>> getJoinQuestions(
        @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(groupService.getJoinQuestions(groupId));
    }

    @PutMapping("/{groupId}/join-questions")
    public ResponseEntity<Void> updateJoinQuestions(
        @PathVariable Long groupId,
        @Valid @RequestBody GroupJoinQuestionsUpdateRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.updateJoinQuestions(groupId, request, customUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> joinGroup(
        @PathVariable Long groupId,
        @RequestBody(required = false) GroupJoinRequest request,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        String answer = request != null ? request.answer() : null;
        groupService.joinGroup(groupId, answer, customUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.leaveGroup(groupId, customUser);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{username}")
    public ResponseEntity<Void> kickMember(
        @PathVariable Long groupId,
        @PathVariable String username,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.kickMember(groupId, username, customUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<PageResponse<GroupMemberResponse>> getMembers(
        @PathVariable Long groupId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int size
    ) {
        PageResponse<GroupMemberResponse> response = groupService.getMembers(groupId, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<PageResponse<GroupResponse>> getMyGroups(
        @AuthenticationPrincipal CustomUser customUser,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<GroupResponse> response = groupService.getMyGroups(customUser, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}/join-requests")
    public ResponseEntity<List<GroupJoinRequestResponse>> getPendingJoinRequests(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        List<GroupJoinRequestResponse> response = groupService.getPendingJoinRequests(groupId, customUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{groupId}/join-requests/me")
    public ResponseEntity<Map<String, Boolean>> getMyJoinRequestStatus(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        boolean pending = groupService.hasMyPendingJoinRequest(groupId, customUser);
        return ResponseEntity.ok(Map.of("pending", pending));
    }

    @DeleteMapping("/{groupId}/join-requests/me")
    public ResponseEntity<Void> cancelMyJoinRequest(
        @PathVariable Long groupId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.cancelMyJoinRequest(groupId, customUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/join-requests/{requestId}/approve")
    public ResponseEntity<Void> approveJoinRequest(
        @PathVariable Long groupId,
        @PathVariable Long requestId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.approveJoinRequest(groupId, requestId, customUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{groupId}/join-requests/{requestId}/reject")
    public ResponseEntity<Void> rejectJoinRequest(
        @PathVariable Long groupId,
        @PathVariable Long requestId,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        groupService.rejectJoinRequest(groupId, requestId, customUser);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{groupId}/members/{username}/role")
    public ResponseEntity<Void> updateMemberRole(
        @PathVariable Long groupId,
        @PathVariable String username,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal CustomUser customUser
    ) {
        String role = body.get("role");
        groupService.updateMemberRole(groupId, username, role, customUser);
        return ResponseEntity.ok().build();
    }
}
