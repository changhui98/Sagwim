package com.peopleground.sagwim.like.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.image.application.ImageUrlResolver;
import com.peopleground.sagwim.like.domain.entity.CommentLike;
import com.peopleground.sagwim.like.domain.entity.ContentLike;
import com.peopleground.sagwim.like.domain.entity.GroupLike;
import com.peopleground.sagwim.like.domain.repository.CommentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import com.peopleground.sagwim.like.presentation.dto.response.LikeToggleResponse;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.notification.domain.entity.NotificationType;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("LikeService 단위 테스트")
class LikeServiceTest {

    @Mock private ContentLikeRepository contentLikeRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private GroupLikeRepository groupLikeRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private ImageUrlResolver imageUrlResolver;
    @Mock private NotificationService notificationService;

    @InjectMocks private LikeService likeService;

    private static final String USERNAME = "me";

    private CustomUser customUser() {
        return new CustomUser(UUID.randomUUID(), USERNAME, null, null, true);
    }

    private User mockUser(UUID id) {
        User user = org.mockito.Mockito.mock(User.class);
        given(user.getId()).willReturn(id);
        return user;
    }

    @Test
    @DisplayName("게시글 좋아요 추가 - 타인의 글이면 likeCount 증가 후 좋아요 알림을 발행한다")
    void toggleContentLike_addOnOthersPost_incrementsAndNotifies() {
        // given
        UUID meId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        User me = mockUser(meId);
        User author = mockUser(authorId);
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.getId()).willReturn(1L);
        given(content.getUser()).willReturn(author);
        given(content.getBody()).willReturn("게시글 본문");

        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(contentLikeRepository.findByContentIdAndUserId(1L, meId)).willReturn(Optional.empty());
        given(contentLikeRepository.insertIfNotExists(1L, meId)).willReturn(1);
        given(contentRepository.findLikeCountById(1L)).willReturn(5);

        // when
        LikeToggleResponse response = likeService.toggleContentLike(1L, customUser());

        // then
        assertThat(response.liked()).isTrue();
        assertThat(response.likeCount()).isEqualTo(5);
        verify(contentRepository).incrementLikeCount(1L);
        verify(notificationService).notify(eq(author), eq(NotificationType.CONTENT_LIKED), eq(me), eq(1L), anyString());
    }

    @Test
    @DisplayName("게시글 좋아요 추가 - 본인의 글이면 알림을 발행하지 않는다")
    void toggleContentLike_addOnOwnPost_doesNotNotify() {
        // given
        UUID meId = UUID.randomUUID();
        User me = mockUser(meId);
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.getId()).willReturn(1L);
        given(content.getUser()).willReturn(me); // 작성자 == 좋아요 누른 사람

        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(contentLikeRepository.findByContentIdAndUserId(1L, meId)).willReturn(Optional.empty());
        given(contentLikeRepository.insertIfNotExists(1L, meId)).willReturn(1);
        given(contentRepository.findLikeCountById(1L)).willReturn(1);

        // when
        LikeToggleResponse response = likeService.toggleContentLike(1L, customUser());

        // then
        assertThat(response.liked()).isTrue();
        verify(contentRepository).incrementLikeCount(1L);
        verify(notificationService, never()).notify(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("게시글 좋아요 취소 - 기존 좋아요가 있으면 삭제 후 likeCount 를 감소시킨다")
    void toggleContentLike_cancel_deletesAndDecrements() {
        // given
        UUID meId = UUID.randomUUID();
        User me = mockUser(meId);
        Content content = org.mockito.Mockito.mock(Content.class);
        ContentLike existing = org.mockito.Mockito.mock(ContentLike.class);

        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(contentLikeRepository.findByContentIdAndUserId(1L, meId)).willReturn(Optional.of(existing));
        given(contentRepository.findLikeCountById(1L)).willReturn(3);

        // when
        LikeToggleResponse response = likeService.toggleContentLike(1L, customUser());

        // then
        assertThat(response.liked()).isFalse();
        assertThat(response.likeCount()).isEqualTo(3);
        verify(contentLikeRepository).delete(existing);
        verify(contentRepository).decrementLikeCount(1L);
        verify(contentLikeRepository, never()).insertIfNotExists(any(), any());
    }

    @Test
    @DisplayName("게시글 좋아요 추가 - 동시성 경합으로 실제 삽입이 0이면 likeCount 를 올리지 않는다")
    void toggleContentLike_insertConflict_doesNotIncrement() {
        // given
        UUID meId = UUID.randomUUID();
        User me = mockUser(meId);
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.getId()).willReturn(1L);

        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(contentLikeRepository.findByContentIdAndUserId(1L, meId)).willReturn(Optional.empty());
        given(contentLikeRepository.insertIfNotExists(1L, meId)).willReturn(0); // 경합
        given(contentRepository.findLikeCountById(1L)).willReturn(7);

        // when
        LikeToggleResponse response = likeService.toggleContentLike(1L, customUser());

        // then
        assertThat(response.liked()).isTrue();
        verify(contentRepository, never()).incrementLikeCount(any());
        verify(notificationService, never()).notify(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("게시글 좋아요 - 존재하지 않는 게시글이면 예외를 던진다")
    void toggleContentLike_notFound_throws() {
        // given
        given(contentRepository.findById(99L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> likeService.toggleContentLike(99L, customUser()))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 좋아요 - 이미 삭제된 댓글이면 예외를 던진다")
    void toggleCommentLike_deletedComment_throws() {
        // given
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(true);
        given(commentRepository.findById(1L)).willReturn(Optional.of(comment));

        // when & then
        assertThatThrownBy(() -> likeService.toggleCommentLike(1L, customUser()))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 좋아요 취소 - 기존 좋아요가 있으면 삭제 후 감소시킨다")
    void toggleCommentLike_cancel_deletesAndDecrements() {
        // given
        UUID meId = UUID.randomUUID();
        User me = mockUser(meId);
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(false);
        CommentLike existing = org.mockito.Mockito.mock(CommentLike.class);

        given(commentRepository.findById(1L)).willReturn(Optional.of(comment));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(commentLikeRepository.findByCommentIdAndUserId(1L, meId)).willReturn(Optional.of(existing));
        given(commentRepository.findLikeCountById(1L)).willReturn(2);

        // when
        LikeToggleResponse response = likeService.toggleCommentLike(1L, customUser());

        // then
        assertThat(response.liked()).isFalse();
        verify(commentLikeRepository).delete(existing);
        verify(commentRepository).decrementLikeCount(1L);
    }

    @Test
    @DisplayName("모임 좋아요 추가 - 매니저들에게 알림을 발행하되 본인은 제외한다")
    void toggleGroupLike_add_notifiesManagersExceptSelf() {
        // given
        UUID meId = UUID.randomUUID();
        UUID otherManagerId = UUID.randomUUID();
        User me = mockUser(meId);
        User otherManager = mockUser(otherManagerId);

        Group group = org.mockito.Mockito.mock(Group.class);
        given(group.getId()).willReturn(10L);
        given(group.getName()).willReturn("모임");

        GroupMember selfManager = org.mockito.Mockito.mock(GroupMember.class);
        given(selfManager.getUser()).willReturn(me); // 본인 매니저
        GroupMember otherMember = org.mockito.Mockito.mock(GroupMember.class);
        given(otherMember.getUser()).willReturn(otherManager);

        given(groupRepository.findById(10L)).willReturn(Optional.of(group));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(groupLikeRepository.findByGroupIdAndUserId(10L, meId)).willReturn(Optional.empty());
        given(groupLikeRepository.insertIfNotExists(10L, meId)).willReturn(1);
        given(groupMemberRepository.findManagersByGroupId(10L)).willReturn(List.of(selfManager, otherMember));
        given(groupRepository.findLikeCountById(10L)).willReturn(4);

        // when
        LikeToggleResponse response = likeService.toggleGroupLike(10L, customUser());

        // then
        assertThat(response.liked()).isTrue();
        verify(groupRepository).incrementLikeCount(10L);
        verify(notificationService).notify(eq(otherManager), eq(NotificationType.MEETING_LIKED), eq(me), eq(10L), eq("모임"));
        verify(notificationService, never()).notify(eq(me), any(), any(), any(), any());
    }

    @Test
    @DisplayName("모임 좋아요 취소 - 기존 좋아요가 있으면 삭제 후 감소시킨다")
    void toggleGroupLike_cancel_deletesAndDecrements() {
        // given
        UUID meId = UUID.randomUUID();
        User me = mockUser(meId);
        Group group = org.mockito.Mockito.mock(Group.class);
        GroupLike existing = org.mockito.Mockito.mock(GroupLike.class);

        given(groupRepository.findById(10L)).willReturn(Optional.of(group));
        given(userRepository.findByUsername(USERNAME)).willReturn(Optional.of(me));
        given(groupLikeRepository.findByGroupIdAndUserId(10L, meId)).willReturn(Optional.of(existing));
        given(groupRepository.findLikeCountById(10L)).willReturn(1);

        // when
        LikeToggleResponse response = likeService.toggleGroupLike(10L, customUser());

        // then
        assertThat(response.liked()).isFalse();
        verify(groupLikeRepository).delete(existing);
        verify(groupRepository).decrementLikeCount(10L);
    }
}
