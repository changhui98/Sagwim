package com.peopleground.sagwim.moderation.infrastructure.repository;

import com.peopleground.sagwim.moderation.domain.entity.ForbiddenWord;
import com.peopleground.sagwim.moderation.domain.repository.ForbiddenWordRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ForbiddenWordRepositoryImpl implements ForbiddenWordRepository {

    private final ForbiddenWordJpaRepository forbiddenWordJpaRepository;

    @Override
    public List<String> findAllActiveWords() {
        return forbiddenWordJpaRepository.findAllActiveWords();
    }

    @Override
    public Page<ForbiddenWord> findActivePage(Pageable pageable) {
        return forbiddenWordJpaRepository.findActivePage(pageable);
    }

    @Override
    public Optional<ForbiddenWord> findActiveById(Long id) {
        return forbiddenWordJpaRepository.findActiveById(id);
    }

    @Override
    public boolean existsActiveByWord(String normalizedWord) {
        return forbiddenWordJpaRepository.existsActiveByWord(normalizedWord);
    }

    @Override
    public Optional<ForbiddenWord> findById(Long id) {
        return forbiddenWordJpaRepository.findById(id);
    }

    @Override
    public Page<ForbiddenWord> findPage(Pageable pageable) {
        return forbiddenWordJpaRepository.findPage(pageable);
    }

    @Override
    public Page<ForbiddenWord> searchPage(String keyword, Pageable pageable) {
        return forbiddenWordJpaRepository.searchPage(keyword, pageable);
    }

    @Override
    public boolean existsActiveByWordExcludingId(String normalizedWord, Long excludeId) {
        return forbiddenWordJpaRepository.existsActiveByWordExcludingId(normalizedWord, excludeId);
    }

    @Override
    public ForbiddenWord save(ForbiddenWord word) {
        return forbiddenWordJpaRepository.save(word);
    }

    @Override
    public void delete(ForbiddenWord word) {
        forbiddenWordJpaRepository.delete(word);
    }
}
