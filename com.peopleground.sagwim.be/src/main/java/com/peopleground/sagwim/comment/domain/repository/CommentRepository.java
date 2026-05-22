package com.peopleground.sagwim.comment.domain.repository;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.content.domain.entity.Content;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommentRepository {

    Comment save(Comment comment);

    Optional<Comment> findById(Long id);

    /**
     * 게시글의 최상위 댓글 목록을 커서 기반으로 조회한다. (createdDate 오름차순)
     * cursorId가 null이면 첫 페이지를 반환한다.
     */
    List<Comment> findTopCommentsByContentId(Long contentId, Long cursorId, int size);

    /**
     * 특정 댓글의 대댓글 목록을 조회한다. (createdDate 오름차순)
     */
    List<Comment> findRepliesByParentId(Long parentId);

    /**
     * 여러 부모 댓글의 대댓글을 한 번에 조회해 parentId 별로 그룹핑하여 반환한다.
     * (N+1 방지용 배치 쿼리)
     */
    java.util.Map<Long, List<Comment>> findRepliesGroupedByParentIds(List<Long> parentIds);

    int countByContentId(Long contentId);

    Optional<Comment> findByImageUrl(String imageUrl);

    /**
     * likeCount 원자적 1 증가.
     */
    int incrementLikeCount(Long id);

    /**
     * likeCount 원자적 1 감소 (0 미만 방지).
     */
    int decrementLikeCount(Long id);

    /**
     * 원자 UPDATE 직후 최신 likeCount 만 가볍게 재조회한다.
     */
    Integer findLikeCountById(Long id);

    /**
     * 내 활동: 특정 사용자가 댓글을 작성한 게시글 목록을 최신순으로 페이지 조회한다.
     * 중복(동일 게시글에 여러 댓글)은 제거하고 게시글 단위로 반환한다.
     * COUNT 쿼리 없이 size+1 방식으로 hasNext 를 판단한다.
     */
    List<Content> findCommentedContentsByAuthorId(UUID authorId, int page, int size);
}
