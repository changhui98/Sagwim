package com.peopleground.sagwim.group.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_group_join_request")
@Table(
    name = "p_group_join_request",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_join_request_group_user",
        columnNames = {"group_id", "user_id"}
    )
)
public class GroupJoinRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupJoinRequestStatus status = GroupJoinRequestStatus.PENDING;

    @Column(nullable = true, length = 1000)
    private String answer;

    public static GroupJoinRequest of(Group group, User user, String answer) {
        GroupJoinRequest req = new GroupJoinRequest();
        req.group = group;
        req.user = user;
        req.status = GroupJoinRequestStatus.PENDING;
        req.answer = answer;
        return req;
    }

    public static GroupJoinRequest of(Group group, User user) {
        return of(group, user, null);
    }

    public void approve() {
        this.status = GroupJoinRequestStatus.APPROVED;
    }

    public void reject() {
        this.status = GroupJoinRequestStatus.REJECTED;
    }

    public void reactivate(String answer) {
        this.status = GroupJoinRequestStatus.PENDING;
        this.answer = answer;
    }

    public void reactivate() {
        reactivate(null);
    }

    public boolean isPending() {
        return this.status == GroupJoinRequestStatus.PENDING;
    }
}
