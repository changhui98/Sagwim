package com.peopleground.sagwim.chat.domain.entity;

import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "chat_message")
@Table(
    name = "p_chat_message",
    indexes = @Index(name = "idx_chat_message_room", columnList = "room_id, id DESC")
)
public class ChatMessage {

    private static final Clock KST_CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatMessageType type;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    public static ChatMessage of(ChatRoom room, User sender, String content, ChatMessageType type) {
        ChatMessage message = new ChatMessage();
        message.room = room;
        message.sender = sender;
        message.content = content;
        message.type = type;
        message.createdDate = LocalDateTime.now(KST_CLOCK);
        return message;
    }
}
