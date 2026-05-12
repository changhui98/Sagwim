package com.peopleground.sagwim.inquiry.presentation.dto.response;

import java.time.LocalDateTime;

/**
 * 관리자 문의/탈퇴사유 응답 DTO.
 *
 * <p>source: WITHDRAWAL(회원 탈퇴 사유) / INQUIRY(일반 문의).</p>
 * <p>authorUsername / authorNickname: 작성 시점 snapshot — 사용자가 영구 삭제되더라도 표시 가능.</p>
 */
public record AdminInquiryResponse(
    Long id,
    String source,
    String content,
    String authorUsername,
    String authorNickname,
    LocalDateTime createdDate
) {
}
