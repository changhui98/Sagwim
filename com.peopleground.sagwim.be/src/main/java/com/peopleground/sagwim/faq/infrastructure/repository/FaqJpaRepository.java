package com.peopleground.sagwim.faq.infrastructure.repository;

import com.peopleground.sagwim.faq.domain.entity.Faq;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqJpaRepository extends JpaRepository<Faq, Long> {

    Page<Faq> findAllByOrderByDisplayOrderAscIdDesc(Pageable pageable);

    List<Faq> findByPublishedTrueOrderByDisplayOrderAscIdDesc();
}
