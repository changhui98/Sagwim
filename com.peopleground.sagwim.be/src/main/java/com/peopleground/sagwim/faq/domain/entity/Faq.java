package com.peopleground.sagwim.faq.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 자주 묻는 질문(FAQ) 엔티티.
 *
 * <ul>
 *   <li>{@code published} 가 true 인 항목만 클라이언트 공개 화면에 노출된다.</li>
 *   <li>{@code displayOrder} 오름차순으로 정렬한다(동순위는 id 내림차순).</li>
 *   <li>BaseEntity 상속: createdDate / lastModifiedDate / deletedDate 자동 관리.</li>
 * </ul>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "faq")
@Table(
    name = "faq",
    indexes = {
        @Index(name = "idx_faq_published_order", columnList = "published, display_order, id")
    }
)
public class Faq extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean published;

    public static Faq of(String question, String answer, int displayOrder, boolean published) {
        Faq faq = new Faq();
        faq.question = question;
        faq.answer = answer;
        faq.displayOrder = displayOrder;
        faq.published = published;
        return faq;
    }

    public void update(String question, String answer, int displayOrder, boolean published) {
        this.question = question;
        this.answer = answer;
        this.displayOrder = displayOrder;
        this.published = published;
    }

    public void togglePublished() {
        this.published = !this.published;
    }
}
