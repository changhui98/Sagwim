package com.peopleground.sagwim.inquiry.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 문의 / 회원 탈퇴 사유 통합 엔티티.
 *
 * <ul>
 *   <li>{@code source} 로 유입 경로 구분: WITHDRAWAL(회원 탈퇴 사유) / INQUIRY(일반 문의).</li>
 *   <li>작성자는 user_id 외에 username/nickname 을 snapshot 으로 저장하여
 *       사용자가 영구 삭제되더라도 관리자 화면에서 식별 가능하다.</li>
 *   <li>BaseEntity 상속: createdDate / lastModifiedDate / deletedDate 자동 관리.</li>
 * </ul>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity(name = "inquiry")
@Table(
    name = "inquiry",
    indexes = {
        @Index(name = "idx_inquiry_source",         columnList = "source"),
        @Index(name = "idx_inquiry_created_date",   columnList = "created_date DESC"),
        @Index(name = "idx_inquiry_author_user_id", columnList = "author_user_id")
    }
)
public class Inquiry extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InquirySource source;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "author_user_id")
    private UUID authorUserId;

    @Column(name = "author_username", length = 50)
    private String authorUsername;

    @Column(name = "author_nickname", length = 50)
    private String authorNickname;

    public static Inquiry of(
        InquirySource source,
        String content,
        UUID authorUserId,
        String authorUsername,
        String authorNickname
    ) {
        Inquiry inquiry = new Inquiry();
        inquiry.source = source;
        inquiry.content = content;
        inquiry.authorUserId = authorUserId;
        inquiry.authorUsername = authorUsername;
        inquiry.authorNickname = authorNickname;
        return inquiry;
    }
}
