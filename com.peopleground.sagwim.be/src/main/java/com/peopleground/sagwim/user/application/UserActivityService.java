package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.application.assembler.ContentResponseAssembler;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final ContentLikeRepository contentLikeRepository;
    private final GroupLikeRepository groupLikeRepository;
    private final CommentRepository commentRepository;
    private final ContentResponseAssembler contentResponseAssembler;
    private final ImageUrlResolver imageUrlResolver;

    /**
     * 내가 좋아요를 누른 게시글 목록을 최신순으로 반환한다.
     * size+1 조회 후 hasNext 판정, trim 으로 초과분 제거.
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getLikedContents(CustomUser customUser, int page, int size) {
        UUID userId = customUser.getId();
        List<Content> raw = new ArrayList<>(
            contentLikeRepository.findLikedContentsByUserId(userId, page, size));
        boolean hasNext = PageResponse.trim(raw, size);
        List<ContentResponse> responses = contentResponseAssembler.toResponseList(raw, customUser);
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    /**
     * 내가 좋아요를 누른 모임 목록을 최신순으로 반환한다.
     * size+1 조회 후 hasNext 판정, trim 으로 초과분 제거.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getLikedGroups(CustomUser customUser, int page, int size) {
        UUID userId = customUser.getId();
        List<Group> raw = new ArrayList<>(
            groupLikeRepository.findLikedGroupsByUserId(userId, page, size));
        boolean hasNext = PageResponse.trim(raw, size);
        List<GroupResponse> responses = raw.stream()
            .map(g -> GroupResponse.from(g, imageUrlResolver.resolve(g.getImageUrl()), true))
            .toList();
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }

    /**
     * 내가 댓글을 작성한 게시글 목록을 최신 댓글 기준 최신순으로 반환한다.
     * 동일 게시글에 여러 댓글을 달았더라도 게시글은 1건만 포함된다.
     * size+1 조회 후 hasNext 판정, trim 으로 초과분 제거.
     */
    @Transactional(readOnly = true)
    public PageResponse<ContentResponse> getCommentedContents(CustomUser customUser, int page, int size) {
        UUID userId = customUser.getId();
        List<Content> raw = new ArrayList<>(
            commentRepository.findCommentedContentsByAuthorId(userId, page, size));
        boolean hasNext = PageResponse.trim(raw, size);
        List<ContentResponse> responses = contentResponseAssembler.toResponseList(raw, customUser);
        return PageResponse.ofSlice(responses, page, size, hasNext);
    }
}
