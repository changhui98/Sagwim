package com.peopleground.sagwim.inquiry.domain.entity;

/**
 * 문의 유입 경로.
 *
 * <ul>
 *   <li>{@link #WITHDRAWAL} — 회원 탈퇴 시 입력한 사유</li>
 *   <li>{@link #INQUIRY} — 일반 문의(향후 사용자 문의 기능 연결 지점)</li>
 * </ul>
 */
public enum InquirySource {
    WITHDRAWAL,
    INQUIRY
}
