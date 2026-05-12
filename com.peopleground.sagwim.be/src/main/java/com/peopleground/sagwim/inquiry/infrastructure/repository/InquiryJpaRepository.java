package com.peopleground.sagwim.inquiry.infrastructure.repository;

import com.peopleground.sagwim.inquiry.domain.entity.Inquiry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InquiryJpaRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findAllByOrderByCreatedDateDesc(Pageable pageable);
}
