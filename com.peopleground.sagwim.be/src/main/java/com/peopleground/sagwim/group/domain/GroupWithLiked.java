package com.peopleground.sagwim.group.domain;

import com.peopleground.sagwim.group.domain.entity.Group;

/**
 * QueryDSL 조회 결과에서 Group 엔티티와 좋아요 여부를 함께 담는 도메인 전송 객체.
 */
public record GroupWithLiked(Group group, boolean liked) {
}
