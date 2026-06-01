package com.peopleground.sagwim.user.presentation.dto.response;

/**
 * "내 활동" 화면의 통합 좋아요 활동 한 건.
 *
 * <p>type 이 "POST" 면 targetId 는 게시글 id, label 은 게시글 본문이다.
 * type 이 "GROUP" 이면 targetId 는 모임 id, label 은 모임 이름이다.
 * 프론트는 type 에 따라 문구와 이동 경로를 분기한다.</p>
 */
public record LikedActivityResponse(String type, Long targetId, String label) {
}
