package com.peopleground.sagwim.user.presentation.dto.request;

/**
 * 회원 탈퇴 요청.
 * <p>reason 은 선택 입력이며 null/빈 문자열도 허용된다. 입력된 사유는 inquiry 테이블에 보존된다.</p>
 */
public record UserWithdrawRequest(
    String reason
) {
}
