package com.peopleground.sagwim.chat.domain.entity;

import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "chat_room_member")
@Table(
    name = "p_chat_room_member",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_chat_room_member",
        columnNames = {"room_id", "user_id"}
    ),
    indexes = @Index(name = "idx_chat_room_member_user", columnList = "user_id, deleted_date")
)
public class ChatRoomMember {

    private static final Clock KST_CLOCK = Clock.system(ZoneId.of("Asia/Seoul"));

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "deleted_date")
    private LocalDateTime deletedDate;

    public static ChatRoomMember of(ChatRoom room, User user) {
        ChatRoomMember member = new ChatRoomMember();
        member.room = room;
        member.user = user;
        member.joinedAt = LocalDateTime.now(KST_CLOCK);
        return member;
    }

    public void updateLastRead(Long messageId) {
        this.lastReadMessageId = messageId;
    }

    public void leave() {
        this.deletedDate = LocalDateTime.now(KST_CLOCK);
    }

    public boolean isActive() {
        return this.deletedDate == null;
    }
}
