package com.peopleground.sagwim.comment.application.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.repository.CommentRepository;
import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.like.domain.repository.CommentLikeRepository;
import com.peopleground.sagwim.notification.application.service.NotificationService;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.entity.UserRole;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService 단위 테스트")
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private CommentService commentService;

    private CustomUser user(String username, UserRole role) {
        return new CustomUser(UUID.randomUUID(), username, null, role, true);
    }

    private Content activeContent() {
        Content content = org.mockito.Mockito.mock(Content.class);
        given(content.isDeleted()).willReturn(false);
        return content;
    }

    @Test
    @DisplayName("대댓글 작성 - 부모 댓글이 삭제된 상태면 예외를 던진다")
    void createReply_deletedParent_throws() {
        // given
        Content content = activeContent();
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername("me")).willReturn(Optional.of(org.mockito.Mockito.mock(User.class)));
        Comment parent = org.mockito.Mockito.mock(Comment.class);
        given(parent.isDeleted()).willReturn(true);
        given(commentRepository.findById(10L)).willReturn(Optional.of(parent));

        // when & then
        assertThatThrownBy(() -> commentService.createReply(1L, 10L, null, user("me", UserRole.USER)))
            .isInstanceOf(AppException.class);
        verify(commentRepository, never()).save(any());
    }

    @Test
    @DisplayName("대댓글 작성 - 대댓글에 다시 답글을 달 수 없다")
    void createReply_replyToReply_throws() {
        // given
        Content content = activeContent();
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        given(userRepository.findByUsername("me")).willReturn(Optional.of(org.mockito.Mockito.mock(User.class)));
        Comment parent = org.mockito.Mockito.mock(Comment.class);
        given(parent.isDeleted()).willReturn(false);
        given(parent.isReply()).willReturn(true); // 이미 대댓글
        given(commentRepository.findById(10L)).willReturn(Optional.of(parent));

        // when & then
        assertThatThrownBy(() -> commentService.createReply(1L, 10L, null, user("me", UserRole.USER)))
            .isInstanceOf(AppException.class);
        verify(commentRepository, never()).save(any());
    }

    @Test
    @DisplayName("댓글 수정 - 작성자가 아니면 예외를 던진다")
    void updateComment_notOwner_throws() {
        // given
        Content content = activeContent();
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(false);
        User other = org.mockito.Mockito.mock(User.class);
        given(other.getUsername()).willReturn("other");
        given(comment.getAuthor()).willReturn(other);
        given(commentRepository.findById(10L)).willReturn(Optional.of(comment));

        // when & then
        assertThatThrownBy(() -> commentService.updateComment(1L, 10L, null, user("me", UserRole.USER)))
            .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("댓글 삭제 - 작성자도 관리자도 아니면 예외를 던진다")
    void deleteComment_notOwnerNotAdmin_throws() {
        // given
        Content content = activeContent();
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(false);
        User other = org.mockito.Mockito.mock(User.class);
        given(other.getUsername()).willReturn("other");
        given(comment.getAuthor()).willReturn(other);
        given(commentRepository.findById(10L)).willReturn(Optional.of(comment));

        // when & then
        assertThatThrownBy(() -> commentService.deleteComment(1L, 10L, user("me", UserRole.USER)))
            .isInstanceOf(AppException.class);
        verify(contentRepository, never()).decrementCommentCount(any());
    }

    @Test
    @DisplayName("댓글 삭제 - 관리자는 타인의 댓글도 삭제할 수 있다")
    void deleteComment_admin_succeeds() {
        // given
        Content content = activeContent();
        given(contentRepository.findById(1L)).willReturn(Optional.of(content));
        Comment comment = org.mockito.Mockito.mock(Comment.class);
        given(comment.isDeleted()).willReturn(false);
        User other = org.mockito.Mockito.mock(User.class);
        given(other.getUsername()).willReturn("other");
        given(comment.getAuthor()).willReturn(other);
        given(commentRepository.findById(10L)).willReturn(Optional.of(comment));
        User adminUser = org.mockito.Mockito.mock(User.class);
        given(userRepository.findByUsername("admin")).willReturn(Optional.of(adminUser));

        // when
        commentService.deleteComment(1L, 10L, user("admin", UserRole.ADMIN));

        // then
        verify(comment).deleteBy(adminUser);
        verify(contentRepository).decrementCommentCount(1L);
    }
}
