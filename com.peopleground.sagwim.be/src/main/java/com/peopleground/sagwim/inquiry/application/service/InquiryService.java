package com.peopleground.sagwim.inquiry.application.service;

import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.inquiry.domain.entity.Inquiry;
import com.peopleground.sagwim.inquiry.domain.entity.InquirySource;
import com.peopleground.sagwim.inquiry.domain.repository.InquiryRepository;
import com.peopleground.sagwim.inquiry.presentation.dto.response.AdminInquiryResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;

    /**
     * 회원 탈퇴 시 입력한 사유를 저장한다.
     *
     * <p>탈퇴와 같은 트랜잭션에서 호출되어, 사용자가 soft delete 되어도 사유는 그대로 남는다.
     * username/nickname 은 작성 시점의 값을 snapshot 으로 저장하여 추후 사용자가 영구 삭제되어도 식별 가능.</p>
     *
     * @param reason 사용자가 입력한 탈퇴 사유 (null/blank 가능 — 그대로 저장)
     */
    @Transactional
    public void saveWithdrawalReason(
        UUID authorUserId,
        String authorUsername,
        String authorNickname,
        String reason
    ) {
        String content = reason == null ? "" : reason;
        Inquiry inquiry = Inquiry.of(
            InquirySource.WITHDRAWAL,
            content,
            authorUserId,
            authorUsername,
            authorNickname
        );
        inquiryRepository.save(inquiry);
    }

    /**
     * 관리자 문의/탈퇴 사유 목록 조회 (최신순).
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminInquiryResponse> getInquiriesForAdmin(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.from(inquiryRepository.findAllForAdmin(pageable));
    }
}
