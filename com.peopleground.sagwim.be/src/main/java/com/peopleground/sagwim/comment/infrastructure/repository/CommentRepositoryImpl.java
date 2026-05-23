package com.peopleground.sagwim.comment.infrastructure.repository;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.entity.Content;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CommentRepositoryImpl implements CommentRepository {

    private final CommentJpaRepository commentJpaRepository;
    private final CommentQueryRepository commentQueryRepository;

    @Override
    public Comment save(Comment comment) {
        return commentJpaRepository.save(comment);
    }

    @Override
    public Optional<Comment> findById(Long id) {
        return commentJpaRepository.findById(id);
    }

    @Override
    public List<Comment> findTopCommentsByContentId(Long contentId, Long cursorId, int size) {
        return commentQueryRepository.findTopCommentsByContentId(contentId, cursorId, size);
    }

    @Override
    public List<Comment> findRepliesByParentId(Long parentId) {
        return commentQueryRepository.findRepliesByParentId(parentId);
    }

    @Override
    public Map<Long, List<Comment>> findRepliesGroupedByParentIds(List<Long> parentIds) {
        return commentQueryRepository.findRepliesGroupedByParentIds(parentIds);
    }

    @Override
    public int countByContentId(Long contentId) {
        return commentQueryRepository.countByContentId(contentId);
    }

    @Override
    public int incrementLikeCount(Long id) {
        return commentJpaRepository.incrementLikeCount(id);
    }

    @Override
    public int decrementLikeCount(Long id) {
        return commentJpaRepository.decrementLikeCount(id);
    }

    @Override
    public Integer findLikeCountById(Long id) {
        return commentJpaRepository.findLikeCountById(id);
    }

    @Override
    public Optional<Comment> findByImageUrl(String imageUrl) {
        return commentJpaRepository.findByImageUrl(imageUrl);
    }

    @Override
    public List<Content> findCommentedContentsByAuthorId(UUID authorId, int page, int size) {
        return commentQueryRepository.findCommentedContentsByAuthorId(authorId, page, size);
    }
}
