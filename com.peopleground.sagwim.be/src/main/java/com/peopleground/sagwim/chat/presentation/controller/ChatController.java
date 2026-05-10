package com.peopleground.sagwim.chat.presentation.controller;

import com.peopleground.sagwim.chat.application.service.ChatService;
import com.peopleground.sagwim.chat.presentation.dto.request.CreateDirectRoomRequest;
import com.peopleground.sagwim.chat.presentation.dto.request.MarkAsReadRequest;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatMessageResponse;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomResponse;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomSummaryResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms/direct")
    public ResponseEntity<ChatRoomResponse> createDirectRoom(
        @AuthenticationPrincipal CustomUser user,
        @Valid @RequestBody CreateDirectRoomRequest request
    ) {
        ChatRoomResponse response = chatService.getOrCreateDirectRoom(user.getId(), request.targetUserId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rooms")
    public ResponseEntity<PageResponse<ChatRoomSummaryResponse>> getRooms(
        @AuthenticationPrincipal CustomUser user,
        @RequestParam(required = false) Long cursor,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(chatService.getRooms(user.getId(), cursor, size));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<PageResponse<ChatMessageResponse>> getMessages(
        @AuthenticationPrincipal CustomUser user,
        @PathVariable Long roomId,
        @RequestParam(required = false) Long cursor,
        @RequestParam(defaultValue = "30") int size
    ) {
        return ResponseEntity.ok(chatService.getMessages(user.getId(), roomId, cursor, size));
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markAsRead(
        @AuthenticationPrincipal CustomUser user,
        @PathVariable Long roomId,
        @Valid @RequestBody MarkAsReadRequest request
    ) {
        chatService.markAsRead(user.getId(), roomId, request.lastMessageId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<Void> leaveRoom(
        @AuthenticationPrincipal CustomUser user,
        @PathVariable Long roomId
    ) {
        chatService.leaveRoom(user.getId(), roomId);
        return ResponseEntity.ok().build();
    }
}
