package com.peopleground.sagwim.user.application;

import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.application.assembler.ContentResponseAssembler;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.content.presentation.dto.response.ContentResponse;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.group.domain.GroupWithLiked;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.like.domain.LikedActivityRow;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import com.peopleground.sagwim.like.domain.repository.LikedActivityRepository;
import com.peopleground.sagwim.user.presentation.dto.response.LikedActivityResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final ContentLikeRepository contentLikeRepository;
    private final GroupLikeRepository groupLikeRepository;
    private final LikedActivityRepository likedActivityRepository;
    private final CommentRepository commentRepository;
    private final ContentRepository contentRepository;
    private final GroupRepository groupRepository;
    private final ContentResponseAssembler contentResponseAssembler;
    private final ImageUrlResolver imageUrlResolver;

    private static final String TYPE_POST = "POST";
    private static final String TYPE_GROUP = "GROUP";

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
     * 내가 좋아요를 누른 게시글과 모임을 좋아요 시각 기준으로 통합하여 최신순으로 반환한다.
     *
     * <p>좋아요 시각 정렬·페이지네이션은 DB UNION 쿼리(size+1 조회)로 처리하고,
     * 라벨(게시글 본문 / 모임 이름)은 type 별 id 를 모아 배치 조회로 채워 N+1 을 피한다.
     * 삭제·비활성 등으로 라벨을 찾지 못한 항목은 결과에서 제외한다.</p>
     */
    @Transactional(readOnly = true)
    public PageResponse<LikedActivityResponse> getLikedActivities(CustomUser customUser, int page, int size) {
        UUID userId = customUser.getId();
        List<LikedActivityRow> rows = new ArrayList<>(
            likedActivityRepository.findLikedActivities(userId, page, size));
        boolean hasNext = PageResponse.trim(rows, size);

        List<Long> postIds = rows.stream()
            .filter(r -> TYPE_POST.equals(r.type()))
            .map(LikedActivityRow::targetId)
            .toList();
        List<Long> groupIds = rows.stream()
            .filter(r -> TYPE_GROUP.equals(r.type()))
            .map(LikedActivityRow::targetId)
            .toList();

        Map<Long, String> postLabels = contentRepository.findAllByIds(postIds).stream()
            .collect(Collectors.toMap(Content::getId, Content::getBody));
        Map<Long, String> groupLabels = groupRepository.findAllByIds(groupIds, userId).stream()
            .map(GroupWithLiked::group)
            .collect(Collectors.toMap(Group::getId, Group::getName, (a, b) -> a));

        List<LikedActivityResponse> responses = rows.stream()
            .map(r -> {
                String label = TYPE_POST.equals(r.type())
                    ? postLabels.get(r.targetId())
                    : groupLabels.get(r.targetId());
                return label == null ? null
                    : new LikedActivityResponse(r.type(), r.targetId(), label);
            })
            .filter(Objects::nonNull)
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
