package com.peopleground.sagwim.report.presentation.dto.response;

import java.time.LocalDateTime;

/**
 * 관리자 신고 내역 응답 DTO.
 *
 * <p>targetContent: 신고된 게시글/댓글 본문. 대상이 삭제된 경우 "(삭제된 콘텐츠)"를 담는다.</p>
 */
public record AdminReportResponse(
    Long id,
    String targetType,
    Long targetId,
    String targetContent,
    String reporterId,
    String reporterNickname,
    String reason,
    LocalDateTime reportedAt
) {
}
