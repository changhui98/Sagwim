package com.peopleground.sagwim.faq.infrastructure.repository;

import com.peopleground.sagwim.faq.domain.entity.Faq;
import com.peopleground.sagwim.faq.domain.repository.FaqRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class FaqRepositoryImpl implements FaqRepository {

    private final FaqJpaRepository faqJpaRepository;

    @Override
    public Faq save(Faq faq) {
        return faqJpaRepository.save(faq);
    }

    @Override
    public Optional<Faq> findById(Long id) {
        return faqJpaRepository.findById(id);
    }

    @Override
    public Page<Faq> findAllForAdmin(Pageable pageable) {
        return faqJpaRepository.findAllByOrderByDisplayOrderAscIdDesc(pageable);
    }

    @Override
    public List<Faq> findPublished() {
        return faqJpaRepository.findByPublishedTrueOrderByDisplayOrderAscIdDesc();
    }

    @Override
    public void delete(Faq faq) {
        faqJpaRepository.delete(faq);
    }
}
