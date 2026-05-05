package com.peopleground.sagwim.notification.domain.entity;

/**
 * 알림 유형.
 *
 * <ul>
 *   <li>{@code CONTENT_LIKED} — 내 게시글에 좋아요</li>
 *   <li>{@code COMMENT_ADDED} — 내 게시글에 댓글 작성</li>
 *   <li>{@code MEETING_MEMBER_JOINED} — 내가 만든 모임에 새 멤버 가입</li>
 *   <li>{@code MEETING_SCHEDULE_ADDED} — 내가 가입한 모임에 일정 등록</li>
 * </ul>
 */
public enum NotificationType {
    CONTENT_LIKED,
    COMMENT_ADDED,
    MEETING_MEMBER_JOINED,
    MEETING_SCHEDULE_ADDED
}
