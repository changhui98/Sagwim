package com.peopleground.sagwim.moderation.infrastructure.repository;

import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWord;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ForbiddenWordJpaRepository extends JpaRepository<ForbiddenWord, Long> {

    @Query("SELECT f.word FROM ForbiddenWord f WHERE f.status = com.peopleground.sagwim.moderation.domain.entity.ForbiddenWordStatus.ACTIVE")
    List<String> findAllActiveWords();

    /**
     * 활성 금지 단어를 최신 등록순(createdDate DESC)으로 페이징 조회한다.
     */
    @Query("SELECT f FROM ForbiddenWord f WHERE f.deletedDate IS NULL ORDER BY f.createdDate DESC")
    Page<ForbiddenWord> findActivePage(Pageable pageable);

    /**
     * ID로 활성 금지 단어를 조회한다.
     */
    @Query("SELECT f FROM ForbiddenWord f WHERE f.id = :id AND f.deletedDate IS NULL")
    Optional<ForbiddenWord> findActiveById(Long id);

    /**
     * 정규화된 단어가 활성 상태로 이미 존재하는지 확인한다.
     */
    @Query("SELECT COUNT(f) > 0 FROM ForbiddenWord f WHERE f.word = :normalizedWord AND f.deletedDate IS NULL")
    boolean existsActiveByWord(String normalizedWord);

    /**
     * 활성/삭제 무관하게 전체 금지 단어를 최신 등록순으로 페이징 조회한다.
     */
    @Query("SELECT f FROM ForbiddenWord f ORDER BY f.createdDate DESC")
    Page<ForbiddenWord> findPage(Pageable pageable);

    /**
     * 정규화된 키워드를 부분 포함하는 금지 단어를 최신 등록순으로 페이징 조회한다.
     * keyword 는 호출 전 {@code ProfanityValidator#normalize} 로 정규화되어 있어야 한다.
     */
    @Query("SELECT f FROM ForbiddenWord f WHERE f.word LIKE CONCAT('%', :keyword, '%') ORDER BY f.createdDate DESC")
    Page<ForbiddenWord> searchPage(String keyword, Pageable pageable);

    /**
     * 지정 ID를 제외한 다른 row 에 동일 word 가 활성 상태로 존재하는지 확인한다.
     */
    @Query("SELECT COUNT(f) > 0 FROM ForbiddenWord f WHERE f.word = :normalizedWord AND f.deletedDate IS NULL AND f.id <> :excludeId")
    boolean existsActiveByWordExcludingId(String normalizedWord, Long excludeId);
}
