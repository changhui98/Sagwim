package com.peopleground.sagwim.inquiry.infrastructure.repository;

import com.peopleground.sagwim.inquiry.domain.entity.Inquiry;
import com.peopleground.sagwim.inquiry.presentation.dto.response.AdminInquiryResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/**
 * 관리자 문의/탈퇴사유 목록 조회.
 *
 * <p>현재는 user 조인이 필요 없는 단순 변환이므로 JPA Page 결과를 매핑하기만 한다.
 * username/nickname 은 Inquiry 자체에 snapshot 으로 보관되어 있어 N+1 위험이 없다.</p>
 */
@Repository
@RequiredArgsConstructor
public class InquiryQueryRepository {

    private final InquiryJpaRepository inquiryJpaRepository;

    public Page<AdminInquiryResponse> findAllForAdmin(Pageable pageable) {
        Page<Inquiry> inquiryPage = inquiryJpaRepository.findAllByOrderByCreatedDateDesc(pageable);

        List<AdminInquiryResponse> result = inquiryPage.getContent().stream()
            .map(inq -> new AdminInquiryResponse(
                inq.getId(),
                inq.getSource().name(),
                inq.getContent(),
                inq.getAuthorUsername(),
                inq.getAuthorNickname(),
                inq.getCreatedDate()
            ))
            .toList();

        return new PageImpl<>(result, pageable, inquiryPage.getTotalElements());
    }
}
