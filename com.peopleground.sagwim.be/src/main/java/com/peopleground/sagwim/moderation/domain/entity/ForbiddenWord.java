package com.peopleground.sagwim.moderation.domain.entity;

import com.peopleground.sagwim.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 금지 단어 엔티티.
 *
 * <ul>
 *   <li>word 는 반드시 정규화된 형태(NFKC → lowercase → 공백 제거)로 저장되어야 한다.
 *       이 계약은 {@code ProfanityValidator#normalize(String)} 을 통해 강제된다.</li>
 *   <li>deleted_date IS NULL 인 항목만 활성 금지 단어로 간주한다. (소프트 삭제)</li>
 *   <li>BaseEntity 상속: createdDate / lastModifiedDate / deletedDate 자동 관리.</li>
 * </ul>
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "forbidden_word")
public class ForbiddenWord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 정규화된 금지 단어. 저장 시점에 반드시 {@code ProfanityValidator#normalize(String)} 을 거쳐야 한다.
     */
    @Column(name = "word", nullable = false, length = 100, unique = true)
    private String word;

    /**
     * 등록한 관리자 username. 닉네임 조회에 사용한다.
     * NULL 은 시드 데이터(초기 적재)를 의미한다.
     */
    @Column(name = "created_by_username")
    private String createdByUsername;

    /**
     * 정적 팩토리.
     *
     * @param normalizedWord    {@code ProfanityValidator#normalize(String)} 을 적용한 단어
     * @param adminUsername     등록 관리자 username (시드인 경우 null)
     */
    public static ForbiddenWord of(String normalizedWord, String adminUsername) {
        ForbiddenWord entity = new ForbiddenWord();
        entity.word = normalizedWord;
        entity.createdByUsername = adminUsername;
        return entity;
    }

    /**
     * 금지 단어를 수정한다. 정규화는 서비스 레이어에서 {@code ProfanityValidator#normalize()} 를 통해 완료해야 한다.
     *
     * @param normalizedWord 정규화된 단어
     */
    public void updateWord(String normalizedWord) {
        this.word = normalizedWord;
    }
}
