package com.peopleground.sagwim.comment.presentation.dto.response;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
    Long id,
    String authorUsername,
    String authorNickname,
    String authorProfileImageUrl,
    String body,
    int likeCount,
    boolean likedByMe,
    boolean deleted,
    String imageUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<CommentResponse> replies
) {

    private static final String DELETED_BODY = "삭제된 댓글입니다.";

    /**
     * 최상위 댓글 변환 (대댓글 포함)
     */
    public static CommentResponse from(Comment comment, List<CommentResponse> replies, boolean likedByMe) {
        boolean isDeleted = comment.isDeleted();
        return new CommentResponse(
            comment.getId(),
            isDeleted ? null : comment.getAuthor().getUsername(),
            isDeleted ? null : comment.getAuthor().getNickname(),
            isDeleted ? null : comment.getAuthor().getProfileImageUrl(),
            isDeleted ? DELETED_BODY : comment.getBody(),
            isDeleted ? 0 : comment.getLikeCount(),
            isDeleted ? false : likedByMe,
            isDeleted,
            isDeleted ? null : comment.getImageUrl(),
            comment.getCreatedDate(),
            comment.getLastModifiedDate(),
            replies
        );
    }

    /**
     * 대댓글 변환 (replies 없음)
     */
    public static CommentResponse from(Comment comment, boolean likedByMe) {
        boolean isDeleted = comment.isDeleted();
        return new CommentResponse(
            comment.getId(),
            isDeleted ? null : comment.getAuthor().getUsername(),
            isDeleted ? null : comment.getAuthor().getNickname(),
            isDeleted ? null : comment.getAuthor().getProfileImageUrl(),
            isDeleted ? DELETED_BODY : comment.getBody(),
            isDeleted ? 0 : comment.getLikeCount(),
            isDeleted ? false : likedByMe,
            isDeleted,
            isDeleted ? null : comment.getImageUrl(),
            comment.getCreatedDate(),
            comment.getLastModifiedDate(),
            List.of()
        );
    }

    /**
     * 비로그인 또는 likedByMe 정보 없이 변환 (댓글 작성/수정 응답 등 단건 반환 시 사용)
     */
    public static CommentResponse from(Comment comment) {
        return from(comment, false);
    }
}
