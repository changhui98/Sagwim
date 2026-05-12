package com.peopleground.sagwim.inquiry.infrastructure.repository;

import com.peopleground.sagwim.inquiry.domain.entity.Inquiry;
import com.peopleground.sagwim.inquiry.domain.repository.InquiryRepository;
import com.peopleground.sagwim.inquiry.presentation.dto.response.AdminInquiryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class InquiryRepositoryImpl implements InquiryRepository {

    private final InquiryJpaRepository inquiryJpaRepository;
    private final InquiryQueryRepository inquiryQueryRepository;

    @Override
    public Inquiry save(Inquiry inquiry) {
        return inquiryJpaRepository.save(inquiry);
    }

    @Override
    public Page<AdminInquiryResponse> findAllForAdmin(Pageable pageable) {
        return inquiryQueryRepository.findAllForAdmin(pageable);
    }
}
