package com.peopleground.sagwim.moderation.domain.repository;

import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 금지 단어 도메인 포트.
 *
 * <p>application 레이어는 이 인터페이스에만 의존하며, 구현체({@code ForbiddenWordRepositoryImpl})는
 * infrastructure 레이어에 위치한다.</p>
 */
public interface ForbiddenWordRepository {

    /**
     * 소프트 삭제되지 않은(deleted_date IS NULL) 금지 단어 문자열 목록을 반환한다.
     * 반환되는 단어는 모두 정규화된 형태(NFKC → lowercase → 공백 제거)로 저장되어 있다.
     */
    List<String> findAllActiveWords();

    /**
     * 활성 금지 단어 페이지를 최신 등록순으로 반환한다.
     *
     * @param pageable 페이지 요청 정보
     * @return 활성 금지 단어 페이지 (deleted_date IS NULL)
     */
    Page<ForbiddenWord> findActivePage(Pageable pageable);

    /**
     * ID로 활성 금지 단어를 조회한다.
     *
     * @param id 금지 단어 ID
     * @return 활성 금지 단어 (deleted_date IS NULL)
     */
    Optional<ForbiddenWord> findActiveById(Long id);

    /**
     * 정규화된 단어가 이미 활성 상태로 존재하는지 확인한다. 중복 등록 방지에 사용한다.
     *
     * @param normalizedWord 정규화된 단어
     * @return 존재 여부
     */
    boolean existsActiveByWord(String normalizedWord);

    /**
     * 활성/삭제 무관하게 ID로 금지 단어를 조회한다. (복원 등 관리자 기능에 사용)
     *
     * @param id 금지 단어 ID
     * @return 금지 단어 (활성/삭제 무관)
     */
    Optional<ForbiddenWord> findById(Long id);

    /**
     * 활성/삭제 무관하게 모든 금지 단어를 최신 등록순으로 페이징 조회한다.
     *
     * @param pageable 페이지 요청 정보
     * @return 전체 금지 단어 페이지 (활성 + 삭제됨)
     */
    Page<ForbiddenWord> findPage(Pageable pageable);

    /**
     * 지정 ID를 제외한 다른 row 에 동일 word 가 활성 상태로 존재하는지 확인한다.
     * 복원 시 중복 단어 검사에 사용한다.
     *
     * @param normalizedWord 정규화된 단어
     * @param excludeId      검사에서 제외할 ID
     * @return 존재 여부
     */
    boolean existsActiveByWordExcludingId(String normalizedWord, Long excludeId);

    /**
     * 금지 단어 엔티티를 저장하고 반환한다.
     *
     * @param word 저장할 엔티티
     * @return 저장된 엔티티
     */
    ForbiddenWord save(ForbiddenWord word);
}
