package com.peopleground.sagwim.moderation.domain.entity;

/**
 * 금지 단어의 차단 활성 상태.
 *
 * <ul>
 *   <li>{@code ACTIVE} — 차단 적용. 해당 단어가 포함된 게시글/모임 생성이 차단된다.</li>
 *   <li>{@code INACTIVE} — 차단 미적용. 목록에는 남아 있으나 생성이 허용된다.</li>
 * </ul>
 */
public enum ForbiddenWordStatus {
    ACTIVE,
    INACTIVE
}
