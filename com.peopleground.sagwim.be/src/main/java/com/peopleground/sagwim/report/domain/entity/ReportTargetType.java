package com.peopleground.sagwim.report.domain.entity;

/**
 * 신고 대상 유형.
 * POST, COMMENT 로 시작하며 추후 MESSAGE(채팅) 등이 추가될 수 있다.
 */
public enum ReportTargetType {
    POST,
    COMMENT,
    MESSAGE
}
