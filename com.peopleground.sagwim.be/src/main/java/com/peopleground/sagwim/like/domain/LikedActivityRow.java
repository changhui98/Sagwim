package com.peopleground.sagwim.like.domain;

import java.time.LocalDateTime;

/**
 * 게시글/모임 좋아요를 좋아요 시각 기준으로 통합 조회한 한 행.
 *
 * <p>type 은 "POST" 또는 "GROUP", targetId 는 게시글 또는 모임의 id,
 * likedAt 은 좋아요를 누른 시각이다. 라벨(게시글 본문 / 모임 이름)은
 * 이 단계에서 채우지 않고, 호출부가 targetId 로 배치 조회하여 조립한다.</p>
 */
public record LikedActivityRow(String type, Long targetId, LocalDateTime likedAt) {
}
