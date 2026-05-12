package com.peopleground.sagwim.inquiry.domain.repository;

import com.peopleground.sagwim.inquiry.domain.entity.Inquiry;
import com.peopleground.sagwim.inquiry.presentation.dto.response.AdminInquiryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InquiryRepository {

    Inquiry save(Inquiry inquiry);

    /**
     * 관리자 문의/탈퇴사유 목록 조회 (최신순).
     */
    Page<AdminInquiryResponse> findAllForAdmin(Pageable pageable);
}
