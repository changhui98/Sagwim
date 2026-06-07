package com.peopleground.sagwim.content.domain.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContentRepository {

    Content save(Content content);

    Optional<Content> findById(Long id);

    Optional<Content> findByIdIncludingDeleted(Long id);

    /**
     * 무한스크롤용: groupId가 null인 게시글을 size+1 개 조회해 반환한다.
     * hasNext 판단은 호출측(ContentService)이 담당한다.
     */
    List<Content> findAllContentsWithoutGroup(int page, int size);

    /**
     * 무한스크롤용: 특정 모임의 게시글을 size+1 개 조회해 반환한다.
     */
    List<Content> findAllByGroupId(Long groupId, int page, int size);

    /**
     * 무한스크롤용: 특정 사용자의 게시글을 size+1 개 조회해 반환한다.
     */
    List<Content> findAllByUsername(String username, int page, int size);

    /**
     * 무한스크롤용: 키워드 검색 결과를 size+1 개 조회해 반환한다.
     */
    List<Content> searchContents(String keyword, SearchType searchType, int page, int size);

    /**
     * 무한스크롤용: 태그별 게시글을 size+1 개 조회해 반환한다.
     */
    List<Content> findAllByTagName(String tagName, int page, int size);

    // ---- 어드민 전용 (COUNT 쿼리 유지) ----

    Page<Content> findAllContentsIncludingDeleted(Pageable pageable);

    Page<Content> searchContentsIncludingDeleted(String keyword, String searchField, Pageable pageable);

    List<Content> findAllByIds(List<Long> ids);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);

    /**
     * likeCount 를 원자적으로 1 증가시킨다. (DB 레벨 Lost Update 방지용)
     */
    int incrementLikeCount(Long id);

    /**
     * likeCount 를 원자적으로 1 감소시킨다. (0 미만 방지)
     */
    int decrementLikeCount(Long id);

    /**
     * 원자 UPDATE 직후 최신 likeCount 만 가볍게 재조회한다. 존재하지 않으면 null 반환.
     */
    Integer findLikeCountById(Long id);

    /**
     * commentCount 원자적 1 증가 (댓글 작성 시 Lost Update 방지).
     */
    int incrementCommentCount(Long id);

    /**
     * commentCount 원자적 1 감소 (0 미만 방지).
     */
    int decrementCommentCount(Long id);
}
