package com.peopleground.sagwim.search.presentation.dto.response;

/**
 * 최근 검색 기록 한 건.
 *
 * <p>type 이 "USER" 면 targetId 는 username, label 은 닉네임, profileImageUrl 은 프로필 이미지.
 * "POST" 면 targetId 는 게시글 id, label 은 본문. "GROUP" 이면 targetId 는 모임 id, label 은 모임 이름.
 * 프론트는 type 에 따라 이동 경로를 분기한다.</p>
 */
public record SearchHistoryResponse(
    String type,
    String targetId,
    String label,
    String profileImageUrl
) {
}
