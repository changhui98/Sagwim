package com.peopleground.sagwim.user.infrastructure.repository;

import com.peopleground.sagwim.user.domain.entity.EmailVerificationToken;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.EmailVerificationTokenRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailVerificationTokenRepositoryImpl implements EmailVerificationTokenRepository {

    private final EmailVerificationTokenJpaRepository emailVerificationTokenJpaRepository;

    @Override
    public Optional<EmailVerificationToken> findByUserEmail(String email) {

        return emailVerificationTokenJpaRepository.findByUserUserEmail(email);
    }

    @Override
    public Optional<EmailVerificationToken> findByUser(User user) {

        return emailVerificationTokenJpaRepository.findByUser(user);
    }

    @Override
    public void deleteByUser(User user) {

        emailVerificationTokenJpaRepository.deleteByUser(user);
    }

    @Override
    public EmailVerificationToken save(EmailVerificationToken token) {

        return emailVerificationTokenJpaRepository.save(token);
    }
}
