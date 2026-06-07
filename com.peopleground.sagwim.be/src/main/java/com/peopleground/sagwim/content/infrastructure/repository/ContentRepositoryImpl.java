package com.peopleground.sagwim.content.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentRepositoryImpl implements ContentRepository {

    private final ContentJpaRepository contentJpaRepository;
    private final ContentQueryRepository contentQueryRepository;

    @Override
    public Content save(Content content) {

        return contentJpaRepository.save(content);
    }

    @Override
    public Optional<Content> findById(Long id) {

        return contentQueryRepository.findById(id);
    }

    @Override
    public Optional<Content> findByIdIncludingDeleted(Long id) {

        return contentQueryRepository.findByIdIncludingDeleted(id);
    }

    @Override
    public List<Content> findAllContentsWithoutGroup(int page, int size) {

        return contentQueryRepository.findAllContentsWithoutGroup(page, size);
    }

    @Override
    public List<Content> findAllByGroupId(Long groupId, int page, int size) {

        return contentQueryRepository.findAllByGroupId(groupId, page, size);
    }

    @Override
    public List<Content> findAllByUsername(String username, int page, int size) {

        return contentQueryRepository.findAllByUsername(username, page, size);
    }

    @Override
    public List<Content> searchContents(String keyword, SearchType searchType, int page, int size) {

        return contentQueryRepository.searchContents(keyword, searchType, page, size);
    }

    @Override
    public List<Content> findAllByTagName(String tagName, int page, int size) {

        return contentQueryRepository.findAllByTagName(tagName, page, size);
    }

    @Override
    public Page<Content> findAllContentsIncludingDeleted(Pageable pageable) {

        return contentQueryRepository.findAllContentsIncludingDeleted(pageable);
    }

    @Override
    public Page<Content> searchContentsIncludingDeleted(String keyword, String searchField, Pageable pageable) {

        return contentQueryRepository.searchContentsIncludingDeleted(keyword, searchField, pageable);
    }

    @Override
    public List<Content> findAllByIds(List<Long> ids) {
        return contentJpaRepository.findAllById(ids);
    }

    @Override
    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {

        return contentQueryRepository.countMonthlyCreations(windowStart);
    }

    @Override
    public int incrementLikeCount(Long id) {
        return contentJpaRepository.incrementLikeCount(id);
    }

    @Override
    public int decrementLikeCount(Long id) {
        return contentJpaRepository.decrementLikeCount(id);
    }

    @Override
    public Integer findLikeCountById(Long id) {
        return contentJpaRepository.findLikeCountById(id);
    }

    @Override
    public int incrementCommentCount(Long id) {
        return contentJpaRepository.incrementCommentCount(id);
    }

    @Override
    public int decrementCommentCount(Long id) {
        return contentJpaRepository.decrementCommentCount(id);
    }
}
