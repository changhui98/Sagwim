package com.peopleground.sagwim.group.domain.entity;

import com.peopleground.sagwim.global.entity.AuditingEntity;
import com.peopleground.sagwim.user.domain.entity.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// GROUP 은 SQL 예약어이므로 반드시 @Entity(name="p_group") + @Table(name="p_group") 명시
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Entity(name = "p_group")
@Table(name = "p_group")
public class Group extends AuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupCategory category;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "group_sub_category", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "sub_category", length = 100)
    @Fetch(FetchMode.SUBSELECT)
    private List<String> subCategories = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupMeetingType meetingType;

    @Column(nullable = false)
    private int maxMemberCount;

    @Column(nullable = false)
    private int currentMemberCount = 0;

    @Column(nullable = true)
    private String imageUrl;

    @Column(nullable = true, length = 50)
    private String region;

    @Column(nullable = false)
    private int likeCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupStatus status = GroupStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupJoinType joinType = GroupJoinType.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id", nullable = false)
    private User leader;

    public static Group of(
        String name,
        String description,
        GroupCategory category,
        List<String> subCategories,
        GroupMeetingType meetingType,
        String region,
        int maxMemberCount,
        User leader
    ) {
        Group group = new Group();
        group.name = name;
        group.description = description;
        group.category = category;
        group.subCategories = subCategories != null ? new ArrayList<>(subCategories) : new ArrayList<>();
        group.meetingType = meetingType;
        group.region = meetingType == GroupMeetingType.ONLINE ? null : region;
        group.maxMemberCount = maxMemberCount;
        group.currentMemberCount = 0;
        group.likeCount = 0;
        group.status = GroupStatus.ACTIVE;
        group.joinType = GroupJoinType.OPEN;
        group.leader = leader;
        return group;
    }

    public void update(String name, String description, GroupCategory category, List<String> subCategories, GroupMeetingType meetingType, String region, int maxMemberCount, GroupJoinType joinType) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.subCategories = subCategories != null ? new ArrayList<>(subCategories) : new ArrayList<>();
        this.meetingType = meetingType;
        this.region = meetingType == GroupMeetingType.ONLINE ? null : region;
        this.maxMemberCount = maxMemberCount;
        this.joinType = joinType;
    }

    public void updateJoinType(GroupJoinType joinType) {
        this.joinType = joinType;
    }

    public void incrementMemberCount() {
        this.currentMemberCount++;
    }

    public void decrementMemberCount() {
        if (this.currentMemberCount > 0) {
            this.currentMemberCount--;
        }
    }

    public boolean isFull() {
        return this.currentMemberCount >= this.maxMemberCount;
    }

    public void updateImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isPending() {
        return this.status == GroupStatus.PENDING;
    }

    public void approve() {
        this.status = GroupStatus.ACTIVE;
    }

    public void reject() {
        this.status = GroupStatus.REJECTED;
    }

    public void delete(User user) {
        this.deleteBy(user);
    }
}
