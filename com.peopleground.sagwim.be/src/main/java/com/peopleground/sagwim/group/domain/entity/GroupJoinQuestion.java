package com.peopleground.sagwim.group.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "p_group_join_question")
@Table(name = "p_group_join_question")
public class GroupJoinQuestion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public static GroupJoinQuestion of(Group group, String question, int displayOrder) {
        GroupJoinQuestion entity = new GroupJoinQuestion();
        entity.group = group;
        entity.question = question;
        entity.displayOrder = displayOrder;
        return entity;
    }

    public void updateQuestion(String question) {
        this.question = question;
    }
}
