package com.peopleground.sagwim.chat.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.mockito.BDDMockito.willThrow;

import com.peopleground.sagwim.chat.application.service.ChatService;
import com.peopleground.sagwim.chat.presentation.dto.request.CreateDirectRoomRequest;
import com.peopleground.sagwim.chat.presentation.dto.request.MarkAsReadRequest;
import com.peopleground.sagwim.chat.presentation.dto.response.ChatRoomResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock ChatService chatService;
    @InjectMocks ChatController controller;

    private CustomUser user;
    private UUID targetUserId;

    @BeforeEach
    void setUp() {
        user = new CustomUser(UUID.randomUUID(), "testuser", "pass", UserRole.USER, true);
        targetUserId = UUID.randomUUID();
    }

    @Test
    @DisplayName("1:1 채팅방 생성/조회 성공")
    void createDirectRoom_success() {
        CreateDirectRoomRequest req = new CreateDirectRoomRequest(targetUserId);
        given(chatService.getOrCreateDirectRoom(user.getId(), targetUserId)).willReturn(new ChatRoomResponse(1L));

        ResponseEntity<ChatRoomResponse> res = controller.createDirectRoom(user, req);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody().roomId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("1:1 채팅방 생성 - 없는 상대방 시 예외 전파")
    void createDirectRoom_targetNotFound() {
        CreateDirectRoomRequest req = new CreateDirectRoomRequest(targetUserId);
        given(chatService.getOrCreateDirectRoom(user.getId(), targetUserId))
            .willThrow(new AppException(ApiErrorCode.INVALID_REQUEST));

        assertThatThrownBy(() -> controller.createDirectRoom(user, req))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("채팅방 목록 조회 성공")
    @SuppressWarnings("unchecked")
    void getRooms_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 20, 0L, 0, false);
        given(chatService.getRooms(user.getId(), null, 20)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getRooms(user, null, 20);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("채팅 메시지 조회 성공")
    @SuppressWarnings("unchecked")
    void getMessages_success() {
        PageResponse<Object> page = new PageResponse<>(List.of(), 0, 30, 0L, 0, false);
        given(chatService.getMessages(user.getId(), 1L, null, 30)).willReturn((PageResponse) page);

        ResponseEntity<?> res = controller.getMessages(user, 1L, null, 30);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("메시지 읽음 처리 성공")
    void markAsRead_success() {
        willDoNothing().given(chatService).markAsRead(user.getId(), 1L, 10L);

        ResponseEntity<Void> res = controller.markAsRead(user, 1L, new MarkAsReadRequest(10L));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("채팅방 나가기 성공")
    void leaveRoom_success() {
        willDoNothing().given(chatService).leaveRoom(user.getId(), 1L);

        ResponseEntity<Void> res = controller.leaveRoom(user, 1L);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("채팅방 나가기 - 참여하지 않은 방이면 예외 전파")
    void leaveRoom_notMember() {
        willThrow(new AppException(ApiErrorCode.FORBIDDEN)).given(chatService).leaveRoom(user.getId(), 999L);

        assertThatThrownBy(() -> controller.leaveRoom(user, 999L))
            .isInstanceOf(AppException.class);
    }
}
