package com.peopleground.sagwim.like.domain.repository;

import com.peopleground.sagwim.like.domain.LikedActivityRow;
import java.util.List;
import java.util.UUID;

/**
 * 게시글 좋아요와 모임 좋아요를 좋아요 시각 기준으로 통합 조회하는 포트.
 */
public interface LikedActivityRepository {

    /**
     * 특정 사용자의 게시글/모임 좋아요를 좋아요 시각 최신순으로 통합 조회한다.
     * 삭제된 게시글/모임은 제외하며, hasNext 판정을 위해 size+1 건을 조회한다.
     */
    List<LikedActivityRow> findLikedActivities(UUID userId, int page, int size);
}
