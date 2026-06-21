package com.peopleground.sagwim.faq.domain.repository;

import com.peopleground.sagwim.faq.domain.entity.Faq;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FaqRepository {

    Faq save(Faq faq);

    Optional<Faq> findById(Long id);

    /**
     * 관리자 목록 조회 (정렬순서 오름차순, 동순위 id 내림차순). 노출/숨김 모두 포함.
     */
    Page<Faq> findAllForAdmin(Pageable pageable);

    /**
     * 공개 목록 조회 (published=true, 정렬순서 오름차순).
     */
    List<Faq> findPublished();

    void delete(Faq faq);
}
